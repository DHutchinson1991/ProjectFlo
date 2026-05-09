#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

/* ═══ Configuration ═══════════════════════════════════════════════════════ */

const ROOT = path.resolve(__dirname, '..');
const BACKEND_SRC = path.join(ROOT, 'packages', 'backend', 'src');
const FRONTEND_FEATURES = path.join(ROOT, 'packages', 'frontend', 'src', 'features');
const SCHEMA_PATH = path.join(ROOT, 'packages', 'backend', 'prisma', 'schema.prisma');
const BACKEND_ENV_PATH = path.join(ROOT, 'packages', 'backend', '.env');
const ROOT_ENV_LOCAL_PATH = path.join(ROOT, '.env.local');
const OUTPUT_DIR = path.join(ROOT, 'docs', 'feature-diagrams');

/* ═══ CLI ═════════════════════════════════════════════════════════════════ */

const args = process.argv.slice(2);
const watchMode = args.includes('--watch');
const featurePath = args.find(a => !a.startsWith('--'));

if (!featurePath || !featurePath.includes('/')) {
  console.error('Usage: node tools/visualize-feature.js [--watch] <bucket/feature>');
  console.error('\nExamples:');
  console.error('  node tools/visualize-feature.js content/moments');
  console.error('  node tools/visualize-feature.js --watch workflow/projects');
  console.error('  node tools/visualize-feature.js catalog/service-packages');
  console.error('\nBuckets: platform, catalog, workflow, content, finance');
  process.exit(1);
}

const [bucket, ...rest] = featurePath.split('/');
const feature = rest.join('/');
const backendDir = path.join(BACKEND_SRC, bucket, feature);
const frontendDir = path.join(FRONTEND_FEATURES, bucket, feature);

/* ═══ Utilities ═══════════════════════════════════════════════════════════ */

function readSafe(fp) {
  try { return fs.readFileSync(fp, 'utf-8'); } catch { return null; }
}

function findFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (pattern.test(entry.name)) results.push(full);
    }
  })(dir);
  return results;
}

function mSafe(text) {
  return text.replace(/"/g, "'").replace(/[<>]/g, '');
}

function hEsc(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function normalizePath(p) {
  return p
    .replace(/^\/api\//, '/')
    .replace(/\$\{[^}]+\}/g, ':_')
    .replace(/:[a-zA-Z_]+/g, ':_')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

function readEnvVar(filePath, key) {
  const content = readSafe(filePath);
  if (!content) return null;
  const re = new RegExp(`^${key}=(.*)$`, 'm');
  const m = content.match(re);
  if (!m) return null;
  return m[1].trim().replace(/^['\"]|['\"]$/g, '');
}

function getLmStudioConfig() {
  const model = readEnvVar(BACKEND_ENV_PATH, 'GEMMA_MODEL') || 'gemma-4-26b-a4b-it';
  const lmUrl = readEnvVar(BACKEND_ENV_PATH, 'LMSTUDIO_URL');
  // LMSTUDIO_URL is usually like http://host:1234/v1, browser requests need base without trailing /v1
  const baseUrl = lmUrl ? lmUrl.replace(/\/v1\/?$/, '') : null;
  return { model, baseUrl };
}

function getBackendApiCandidates() {
  const backendPort = readEnvVar(BACKEND_ENV_PATH, 'PORT') || '3002';
  const configuredApi = readEnvVar(ROOT_ENV_LOCAL_PATH, 'NEXT_PUBLIC_API_URL');
  const candidates = [];

  // Prefer local backend for local HTML preview.
  candidates.push(`http://127.0.0.1:${backendPort}`);
  candidates.push(`http://localhost:${backendPort}`);

  if (configuredApi) candidates.push(configuredApi.replace(/\/$/, ''));

  return [...new Set(candidates)];
}

/* ═══ Backend Parsers ═════════════════════════════════════════════════════ */

function parseController(content, filePath) {
  const prefixMatch = content.match(/@Controller\(\s*['"`]([^'"`]*)['"`]\s*\)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const lines = content.split('\n');

  // Parse constructor to map variable names → service class names
  const injections = {};
  const ctorMatch = content.match(/constructor\s*\([\s\S]*?\)/);
  if (ctorMatch) {
    for (const im of ctorMatch[0].matchAll(/(\w+)\s*:\s*(\w+)/g)) {
      injections[im[1]] = im[2];
    }
  }

  const endpoints = [];
  const re = /@(Get|Post|Put|Patch|Delete)\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;
  let m;

  while ((m = re.exec(content)) !== null) {
    const method = m[1].toUpperCase();
    const route = m[2] || '';
    const decoratorLine = content.slice(0, m.index).split('\n').length;
    const after = content.slice(m.index + m[0].length);
    const handlerMatch = after.match(/(?:async\s+)?(\w+)\s*\(/);
    if (handlerMatch) {
      let fullPath = prefix;
      if (route) fullPath += '/' + route;
      fullPath = '/' + fullPath.replace(/^\/+/, '');

      // Find which services this handler calls (this.xxx.yyy())
      // Scope: text between this decorator and the next HTTP decorator
      const serviceCalls = [];
      const seenCalls = new Set();
      const nextDec = after.slice(10).search(/@(Get|Post|Put|Patch|Delete)\s*\(/);
      const scope = after.slice(0, nextDec > 0 ? nextDec + 10 : 1000);
      for (const sm of scope.matchAll(/this\.(\w+)\.(\w+)\(/g)) {
        const cls = injections[sm[1]] || sm[1];
        const key = `${cls}.${sm[2]}`;
        if (!seenCalls.has(key)) {
          seenCalls.add(key);
          serviceCalls.push({ className: cls, methodName: sm[2] });
        }
      }
      endpoints.push({ method, path: fullPath, handler: handlerMatch[1], serviceCalls, line: decoratorLine, file: filePath });
    }
  }
  return { prefix: '/' + prefix, endpoints };
}

function parseService(content, filePath) {
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Unknown';
  const allLines = content.split('\n');

  // Detect indent from constructor or first decorated method
  const indentMatch = content.match(/^(\s+)(?:constructor|async\s+\w+\s*\(|\w+\s*\()/m);
  const indent = indentMatch ? indentMatch[1].length : 2;

  const methods = [];
  const seen = new Set();
  const skip = new Set([
    'constructor', 'if', 'for', 'while', 'switch', 'return', 'throw',
    'catch', 'super', 'new', 'await', 'const', 'let', 'var', 'try',
  ]);

  for (let lineIdx = 0; lineIdx < allLines.length; lineIdx++) {
    const line = allLines[lineIdx];
    const lineIndent = (line.match(/^(\s*)/) || ['', ''])[1].length;
    if (lineIndent !== indent) continue;

    const trimmed = line.trim();
    if (/^(private|protected|static|readonly|get |set |constructor|\/\/|\/\*|\*|@|}\s*$)/.test(trimmed)) continue;

    const mm = trimmed.match(/^(async\s+)?([a-zA-Z_]\w*)\s*[(<]/);
    if (mm && !skip.has(mm[2]) && !seen.has(mm[2])) {
      seen.add(mm[2]);

      // Extract method body via brace-matching from this line
      const bodyStart = content.indexOf('{', sumChars(allLines, lineIdx));
      let body = '';
      if (bodyStart >= 0) {
        let depth = 0;
        for (let i = bodyStart; i < content.length; i++) {
          if (content[i] === '{') depth++;
          else if (content[i] === '}') { depth--; if (depth === 0) { body = content.slice(bodyStart, i + 1); break; } }
        }
      }

      // Cyclomatic complexity: count branching constructs
      const complexity = calcComplexity(body);

      methods.push({ name: mm[2], isAsync: !!mm[1], line: lineIdx + 1, file: filePath, body, complexity });
    }
  }
  return { className, methods, file: filePath };
}

function sumChars(lines, upToIdx) {
  let c = 0;
  for (let i = 0; i < upToIdx; i++) c += lines[i].length + 1;
  return c;
}

function calcComplexity(body) {
  if (!body) return 1;
  let score = 1; // baseline
  // Count branching keywords (word-boundary to avoid partial matches)
  const patterns = [/\bif\s*\(/g, /\belse\b/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bswitch\s*\(/g,
    /\bcatch\s*\(/g, /\?\?/g, /\?\./g, /\bthrow\s+new\b/g];
  for (const p of patterns) {
    const matches = body.match(p);
    if (matches) score += matches.length;
  }
  // Ternaries (? not followed by ? or .)
  const ternaries = body.match(/\?[^?.]/g);
  if (ternaries) score += ternaries.length;
  return score;
}

function parseDtoFile(content) {
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  const name = classMatch ? classMatch[1] : 'Unknown';
  const fields = [];
  let decorators = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@')) {
      const dec = trimmed.match(/@(\w+)/);
      if (dec) decorators.push(`@${dec[1]}`);
      continue;
    }
    const prop = trimmed.match(/^(\w+)\s*[?!]?\s*:\s*(.+?)\s*;?\s*$/);
    if (prop && !trimmed.startsWith('export') && !trimmed.startsWith('class') && !trimmed.startsWith('constructor')) {
      fields.push({ name: prop[1], type: prop[2].replace(/;$/, ''), decorators: [...decorators] });
      decorators = [];
    } else if (trimmed === '' || trimmed === '}' || trimmed === '{') {
      decorators = [];
    }
  }
  return { name, fields };
}

/* ═══ Frontend Parsers ════════════════════════════════════════════════════ */

function parseApiBindings(content, filePath) {
  const bindings = [];
  // Match object property pattern: name: (...) => client.method(`url`)
  // Uses : separator to skip factory function assignments (createXxxApi = ...)
  const re = /(\w+)\s*:\s*(?:async\s*)?\([^)]*\)(?::\s*\w+[^=]*?)?\s*=>[^]*?\.(get|post|put|patch|delete)\s*(?:<[^>]*>)?\s*\(\s*[`'"]([^`'"]*)[`'"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const line = content.slice(0, m.index).split('\n').length;
    bindings.push({
      name: m[1],
      method: m[2].toUpperCase(),
      path: m[3].replace(/\$\{[^}]+\}/g, ':param'),
      line,
      file: filePath,
    });
  }
  return bindings;
}

function parseHook(content, fileName, filePath) {
  const hookMatch = content.match(/export\s+(?:function|const)\s+(use\w+)/);
  const name = hookMatch ? hookMatch[1] : fileName.replace(/\.(ts|tsx)$/, '');
  const line = hookMatch ? content.slice(0, hookMatch.index).split('\n').length : 1;

  const apiCalls = new Set();
  const apiRe = /(\w+(?:Api|api))\s*\.\s*(\w+)/g;
  let m;
  while ((m = apiRe.exec(content)) !== null) apiCalls.add(`${m[1]}.${m[2]}`);

  const hookDeps = new Set();
  const depRe = /\b(use[A-Z]\w*)\s*\(/g;
  while ((m = depRe.exec(content)) !== null) {
    if (m[1] !== name && !['useCallback', 'useState', 'useEffect', 'useMemo', 'useRef', 'useContext', 'useReducer', 'useId', 'useLayoutEffect'].includes(m[1])) {
      hookDeps.add(m[1]);
    }
  }

  return { name, apiCalls: [...apiCalls], hookDeps: [...hookDeps], line, file: filePath };
}

function listComponents(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(tsx?)$/.test(f) && !f.startsWith('index.'))
    .map(f => ({ name: f.replace(/\.(tsx?)$/, ''), file: path.join(dir, f) }));
}

/* ═══ Prisma Parser ═══════════════════════════════════════════════════════ */

function parsePrismaModel(schema, modelName) {
  const re = new RegExp(`model\\s+${modelName}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
  const m = schema.match(re);
  if (!m) return null;

  const scalars = new Set(['Int', 'String', 'DateTime', 'Boolean', 'Float', 'Decimal', 'Json', 'BigInt', 'Bytes']);
  const fields = [];
  const relations = [];

  for (const line of m[1].split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('//') || t.startsWith('@@')) continue;
    const fm = t.match(/^(\w+)\s+(\w+)(\?)?(\[\])?(.*)/);
    if (!fm) continue;
    const [, name, type, opt, arr, rest] = fm;
    if (scalars.has(type)) {
      fields.push({ name, type, isPk: (rest || '').includes('@id'), isFk: name.endsWith('_id'), isOptional: !!opt });
    } else {
      relations.push({ name, type, isArray: !!arr, isOptional: !!opt });
    }
  }
  return { modelName, fields, relations };
}

function findPrismaModels(dir) {
  const models = new Map();
  for (const file of findFiles(dir, /\.service\.ts$/)) {
    const content = readSafe(file);
    if (!content) continue;
    for (const m of content.matchAll(/this\.prisma\.(\w+)\./g)) {
      const camel = m[1];
      if (camel.startsWith('$')) continue;
      const pascal = camel.charAt(0).toUpperCase() + camel.slice(1);
      models.set(pascal, (models.get(pascal) || 0) + 1);
    }
  }
  return [...models.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

/* ═══ Mermaid Generators ══════════════════════════════════════════════════ */

function flowChart(data) {
  const { endpoints, services, apiBindings, hooks, components, prismaModel } = data;
  let c = 'graph TB\n';
  c += '    classDef fe fill:#e3f2fd,stroke:#1565c0,color:#0d47a1\n';
  c += '    classDef be fill:#fff3e0,stroke:#e65100,color:#bf360c\n';
  c += '    classDef db fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20\n';
  c += '    classDef hk fill:#f3e5f5,stroke:#6a1b9a,color:#4a148c\n\n';

  // Frontend
  const hasFE = components.length || hooks.length || apiBindings.length;
  if (hasFE) {
    c += '    subgraph FE["Frontend"]\n';
    c += '        direction TB\n';
    if (components.length) {
      c += '        subgraph Comps["Components"]\n';
      components.forEach((x, i) => { c += `            C${i}["${mSafe(x.name)}"]\n`; });
      c += '        end\n';
    }
    if (hooks.length) {
      c += '        subgraph HooksG["Hooks"]\n';
      hooks.forEach((x, i) => { c += `            H${i}["${mSafe(x.name)}"]\n`; });
      c += '        end\n';
    }
    if (apiBindings.length) {
      c += '        subgraph ApiG["API Bindings"]\n';
      apiBindings.forEach((x, i) => { c += `            A${i}["${mSafe(x.name)}()"]\n`; });
      c += '        end\n';
    }
    c += '    end\n\n';
  }

  // Backend
  const hasBE = endpoints.length || services.length;
  if (hasBE) {
    c += '    subgraph BE["Backend"]\n';
    c += '        direction TB\n';
    if (endpoints.length) {
      c += '        subgraph Ctrl["Controller"]\n';
      endpoints.forEach((x, i) => { c += `            E${i}["${x.method} ${mSafe(x.path)}"]\n`; });
      c += '        end\n';
    }
    if (services.length) {
      c += '        subgraph Svcs["Services"]\n';
      services.forEach((x, i) => { c += `            S${i}["${mSafe(x.className)}"]\n`; });
      c += '        end\n';
    }
    c += '    end\n\n';
  }

  // Database
  if (prismaModel) {
    c += `    DB[("${prismaModel.modelName}")]\n\n`;
  }

  // Connections: Hooks → API bindings
  hooks.forEach((h, hi) => {
    h.apiCalls.forEach(call => {
      const methodName = call.split('.').pop();
      const ai = apiBindings.findIndex(a => a.name === methodName);
      if (ai >= 0) c += `    H${hi} --> A${ai}\n`;
    });
    h.hookDeps.forEach(dep => {
      const di = hooks.findIndex(hh => hh.name === dep);
      if (di >= 0) c += `    H${hi} -.-> H${di}\n`;
    });
  });

  // Connections: API → Endpoints (match by normalized path + method)
  apiBindings.forEach((a, ai) => {
    const normA = normalizePath(a.path);
    let best = -1;
    endpoints.forEach((e, ei) => {
      if (a.method !== e.method) return;
      const normE = normalizePath(e.path);
      if (normA === normE || normA.endsWith(normE) || normE.endsWith(normA)) best = ei;
    });
    if (best >= 0) c += `    A${ai} -->|"${a.method}"| E${best}\n`;
  });

  // Connections: Endpoints → Services (targeted via parsed service calls)
  if (services.length) {
    endpoints.forEach((e, ei) => {
      if (e.serviceCalls && e.serviceCalls.length) {
        e.serviceCalls.forEach(sc => {
          const si = services.findIndex(s => s.className === (sc.className || sc));
          if (si >= 0) c += `    E${ei} --> S${si}\n`;
        });
      } else {
        c += `    E${ei} --> S0\n`; // fallback to first service
      }
    });
  }

  // Connections: Services → DB
  if (prismaModel) {
    services.forEach((_, si) => { c += `    S${si} --> DB\n`; });
  }

  // Style classes
  components.forEach((_, i) => { c += `    class C${i} fe\n`; });
  hooks.forEach((_, i) => { c += `    class H${i} hk\n`; });
  apiBindings.forEach((_, i) => { c += `    class A${i} fe\n`; });
  endpoints.forEach((_, i) => { c += `    class E${i} be\n`; });
  services.forEach((_, i) => { c += `    class S${i} be\n`; });
  if (prismaModel) c += '    class DB db\n';

  return c;
}

function hookGraph(data) {
  const { hooks } = data;
  if (!hooks.length) return '';

  let c = 'graph LR\n';
  c += '    classDef hk fill:#f3e5f5,stroke:#6a1b9a,color:#4a148c\n';
  c += '    classDef api fill:#e3f2fd,stroke:#1565c0,color:#0d47a1\n\n';

  hooks.forEach((h, i) => { c += `    H${i}["${h.name}"]\n`; });
  c += '\n';

  const apiNodes = new Set();
  hooks.forEach((h, hi) => {
    h.hookDeps.forEach(dep => {
      const di = hooks.findIndex(hh => hh.name === dep);
      if (di >= 0) c += `    H${hi} -.->|uses| H${di}\n`;
    });
    h.apiCalls.forEach(call => {
      const nodeId = call.replace(/\./g, '_');
      if (!apiNodes.has(nodeId)) {
        c += `    ${nodeId}["${call}"]\n`;
        c += `    class ${nodeId} api\n`;
        apiNodes.add(nodeId);
      }
      c += `    H${hi} -->|calls| ${nodeId}\n`;
    });
  });

  hooks.forEach((_, i) => { c += `    class H${i} hk\n`; });
  return c;
}

function erDiagram(model) {
  if (!model) return '';
  let c = 'erDiagram\n';
  c += `    ${model.modelName} {\n`;
  for (const f of model.fields) {
    const tag = f.isPk ? ' PK' : (f.isFk ? ' FK' : '');
    c += `        ${f.type.toLowerCase()} ${f.name}${tag}\n`;
  }
  c += '    }\n';

  for (const r of model.relations) {
    const isParent = model.fields.some(f => f.name === `${r.name}_id`);
    if (isParent) {
      c += `    ${model.modelName} }o--|| ${r.type} : "${r.name}"\n`;
    } else if (r.isArray) {
      c += `    ${model.modelName} ||--o{ ${r.type} : "${r.name}"\n`;
    } else if (r.isOptional) {
      c += `    ${model.modelName} ||--o| ${r.type} : "${r.name}"\n`;
    } else {
      c += `    ${model.modelName} ||--|| ${r.type} : "${r.name}"\n`;
    }
  }
  return c;
}

function sequenceDiagram() {
  return `sequenceDiagram
    participant UI as Component
    participant H as Hook
    participant A as API Binding
    participant C as Controller
    participant S as Service
    participant DB as Database

    UI->>H: invoke hook
    H->>A: call API method
    A->>C: HTTP request
    C->>S: delegate to service
    S->>DB: Prisma query
    DB-->>S: result
    S-->>C: return data
    C-->>A: HTTP response
    A-->>H: typed response
    H-->>UI: update state (React Query)`;
}

/* ═══ Data Collection ═════════════════════════════════════════════════════ */

function collect() {
  const data = {
    bucket, feature,
    endpoints: [], services: [], apiBindings: [], hooks: [],
    components: [], prismaModel: null, prismaModels: [], dtos: [],
    backendFiles: [], frontendFiles: [],
    backendExists: fs.existsSync(backendDir),
    frontendExists: fs.existsSync(frontendDir),
  };

  // Backend
  if (data.backendExists) {
    for (const file of findFiles(backendDir, /\.controller\.ts$/)) {
      data.backendFiles.push(path.relative(backendDir, file));
      const content = readSafe(file);
      if (content) data.endpoints.push(...parseController(content, file).endpoints);
    }
    for (const file of findFiles(backendDir, /\.service\.ts$/)) {
      data.backendFiles.push(path.relative(backendDir, file));
      const content = readSafe(file);
      if (content) data.services.push(parseService(content, file));
    }
    const dtoDir = path.join(backendDir, 'dto');
    for (const file of findFiles(dtoDir, /\.dto\.ts$/)) {
      data.backendFiles.push('dto/' + path.basename(file));
      const content = readSafe(file);
      if (content) data.dtos.push(parseDtoFile(content));
    }
  }

  // Frontend
  if (data.frontendExists) {
    const apiDir = path.join(frontendDir, 'api');
    for (const file of findFiles(apiDir, /\.(ts|tsx)$/)) {
      data.frontendFiles.push('api/' + path.basename(file));
      const content = readSafe(file);
      if (content) data.apiBindings.push(...parseApiBindings(content, file));
    }
    const hooksDir = path.join(frontendDir, 'hooks');
    for (const file of findFiles(hooksDir, /^use.*\.(ts|tsx)$/)) {
      data.frontendFiles.push('hooks/' + path.basename(file));
      const content = readSafe(file);
      if (content) data.hooks.push(parseHook(content, path.basename(file), file));
    }
    const compsDir = path.join(frontendDir, 'components');
    data.components = listComponents(compsDir);
    data.components.forEach(c => data.frontendFiles.push('components/' + c.name));
  }

  // Prisma
  const schema = readSafe(SCHEMA_PATH);
  if (schema && data.backendExists) {
    const modelNames = findPrismaModels(backendDir);
    data.prismaModels = modelNames;
    if (modelNames.length) {
      data.prismaModel = parsePrismaModel(schema, modelNames[0]);
    }
    // Fallback: infer from feature name
    if (!data.prismaModel) {
      const pascal = feature.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      data.prismaModel = parsePrismaModel(schema, pascal);
    }
  }

  return data;
}

/* ═══ Chain Tracing ═══════════════════════════════════════════════════════ */

function traceChains(data) {
  const bindingsByEp = new Map();
  const hooksByBinding = new Map();

  data.apiBindings.forEach((b, bi) => {
    const normB = normalizePath(b.path);
    data.endpoints.forEach((e, ei) => {
      if (b.method !== e.method) return;
      const normE = normalizePath(e.path);
      if (normB === normE || normB.endsWith(normE) || normE.endsWith(normB)) {
        if (!bindingsByEp.has(ei)) bindingsByEp.set(ei, []);
        bindingsByEp.get(ei).push(bi);
      }
    });
  });

  data.hooks.forEach((h, hi) => {
    data.apiBindings.forEach((b, bi) => {
      if (h.apiCalls.some(c => c.split('.').pop() === b.name)) {
        if (!hooksByBinding.has(bi)) hooksByBinding.set(bi, []);
        hooksByBinding.get(bi).push(hi);
      }
    });
  });

  const usedHooks = new Set();
  const usedBindings = new Set();
  const tracedMethods = new Set();

  const chains = data.endpoints.map((ep, ei) => {
    const bis = bindingsByEp.get(ei) || [];
    const hookSet = new Set();
    bis.forEach(bi => {
      usedBindings.add(bi);
      (hooksByBinding.get(bi) || []).forEach(hi => { hookSet.add(hi); usedHooks.add(hi); });
    });

    const svcMethods = (ep.serviceCalls || []).map(sc => {
      const cls = sc.className || sc;
      const mn = sc.methodName || '';
      const svc = data.services.find(s => s.className === cls);
      const method = svc && mn ? svc.methods.find(m => m.name === mn) : null;
      tracedMethods.add(`${cls}.${mn}`);
      return { className: cls, methodName: mn, method, service: svc };
    });

    return {
      name: humanize(ep.handler),
      endpoint: ep,
      bindings: bis.map(i => data.apiBindings[i]),
      hooks: [...hookSet].map(i => data.hooks[i]),
      svcMethods,
    };
  });

  const orphanHooks = data.hooks.filter((_, i) => !usedHooks.has(i));
  const orphanBindings = data.apiBindings.filter((_, i) => !usedBindings.has(i));
  const standaloneMethods = [];
  data.services.forEach(s => {
    s.methods.forEach(m => {
      if (!tracedMethods.has(`${s.className}.${m.name}`)) {
        standaloneMethods.push({ ...m, className: s.className });
      }
    });
  });

  return { chains, orphanHooks, orphanBindings, standaloneMethods };
}

function humanize(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
}

/* ═══ Output: Markdown ════════════════════════════════════════════════════ */

function toMarkdown(data) {
  let md = `# ${data.bucket}/${data.feature} — Feature Diagram\n\n`;
  md += `> Auto-generated by \`tools/visualize-feature.js\` on ${new Date().toLocaleString()}\n\n`;

  // Files analyzed
  md += '## Files Analyzed\n\n';
  if (data.backendFiles.length) {
    md += `**Backend** (\`packages/backend/src/${data.bucket}/${data.feature}/\`)\n`;
    data.backendFiles.forEach(f => { md += `- ${f}\n`; });
    md += '\n';
  }
  if (data.frontendFiles.length) {
    md += `**Frontend** (\`packages/frontend/src/features/${data.bucket}/${data.feature}/\`)\n`;
    data.frontendFiles.forEach(f => { md += `- ${f}\n`; });
    md += '\n';
  }

  // Architecture flow
  md += '## Architecture Flow\n\n';
  md += '```mermaid\n' + flowChart(data) + '\n```\n\n';

  // Request sequence
  md += '## Request Flow (Generic)\n\n';
  md += '```mermaid\n' + sequenceDiagram() + '\n```\n\n';

  // API endpoints
  if (data.endpoints.length) {
    md += '## API Endpoints\n\n';
    md += '| Method | Path | Handler |\n|--------|------|---------|\n';
    data.endpoints.forEach(e => { md += `| \`${e.method}\` | \`${e.path}\` | \`${e.handler}()\` |\n`; });
    md += '\n';
  }

  // Services
  if (data.services.length) {
    md += '## Backend Services\n\n';
    data.services.forEach(s => {
      md += `### ${s.className}\n\n`;
      if (s.methods.length) {
        md += '| Method | Async |\n|--------|-------|\n';
        s.methods.forEach(m => { md += `| \`${m.name}()\` | ${m.isAsync ? '✓' : ''} |\n`; });
      }
      md += '\n';
    });
  }

  // Hook diagram
  if (data.hooks.length) {
    md += '## Frontend Hooks\n\n';
    const hg = hookGraph(data);
    if (hg) md += '```mermaid\n' + hg + '\n```\n\n';

    md += '| Hook | API Calls | Hook Dependencies |\n|------|-----------|-------------------|\n';
    data.hooks.forEach(h => {
      md += `| \`${h.name}\` | ${h.apiCalls.map(c => `\`${c}\``).join(', ') || '—'} | ${h.hookDeps.map(d => `\`${d}\``).join(', ') || '—'} |\n`;
    });
    md += '\n';
  }

  // Data model
  if (data.prismaModel) {
    md += `## Data Model: ${data.prismaModel.modelName}\n\n`;
    md += '```mermaid\n' + erDiagram(data.prismaModel) + '\n```\n\n';

    md += '### Fields\n\n';
    md += '| Field | Type | PK | FK | Optional |\n|-------|------|----|----|----------|\n';
    data.prismaModel.fields.forEach(f => {
      md += `| \`${f.name}\` | ${f.type} | ${f.isPk ? '✓' : ''} | ${f.isFk ? '✓' : ''} | ${f.isOptional ? '✓' : ''} |\n`;
    });
    md += '\n';

    if (data.prismaModel.relations.length) {
      md += '### Relations\n\n';
      md += '| Relation | Type | Cardinality |\n|----------|------|-------------|\n';
      data.prismaModel.relations.forEach(r => {
        const card = r.isArray ? '1:many' : (r.isOptional ? '0..1' : '1:1');
        md += `| \`${r.name}\` | ${r.type} | ${card} |\n`;
      });
      md += '\n';
    }

    if (data.prismaModels.length > 1) {
      md += '### Other Referenced Models\n\n';
      data.prismaModels.slice(1).forEach(m => { md += `- ${m}\n`; });
      md += '\n';
    }
  }

  // DTOs
  if (data.dtos.length) {
    md += '## DTOs\n\n';
    data.dtos.forEach(dto => {
      md += `### ${dto.name}\n\n`;
      if (dto.fields.length) {
        md += '| Field | Type | Validators |\n|-------|------|------------|\n';
        dto.fields.forEach(f => {
          md += `| \`${f.name}\` | \`${f.type}\` | ${f.decorators.join(', ') || '—'} |\n`;
        });
      }
      md += '\n';
    });
  }

  return md;
}

/* ═══ Output: HTML ════════════════════════════════════════════════════════ */

function toHtml(data) {
  const traced = traceChains(data);
  const lmStudio = getLmStudioConfig();
  const backendApiCandidates = getBackendApiCandidates();

  const methodBodies = {};
  data.services.forEach(s => {
    s.methods.forEach(m => {
      if (m.body) methodBodies[`${s.className}.${m.name}`] = m.body;
    });
  });

  const hotspots = [];
  data.services.forEach(s => {
    s.methods.forEach(m => {
      hotspots.push({ key: `${s.className}.${m.name}`, name: m.name, className: s.className, complexity: m.complexity, file: m.file, line: m.line });
    });
  });
  hotspots.sort((a, b) => b.complexity - a.complexity);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.bucket}/${data.feature}</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #111113; --bg2: #19191c; --bg3: #222225; --bg4: #2c2c30;
      --border: #2c2c30; --border2: #3a3a3f;
      --t1: #ededef; --t2: #a0a0a8; --t3: #6e6e76;
      --cyan: #32d4c2; --blue: #5b9cf5; --violet: #a07ef5;
      --amber: #e5a63e; --rose: #e85d75; --green: #4ade80;
      --mono: 'IBM Plex Mono', 'Consolas', monospace;
      --sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    body { font-family: var(--sans); background: var(--bg); color: var(--t1); min-height: 100vh; }

    /* ── TOP BAR ── */
    .topbar { display: flex; align-items: center; gap: 12px; padding: 12px 24px; border-bottom: 1px solid var(--border); background: var(--bg2); position: sticky; top: 0; z-index: 10; }
    .topbar-path { font-family: var(--mono); font-size: 13px; color: var(--t2); }
    .topbar-path b { color: var(--t1); font-weight: 600; }
    .topbar-counts { margin-left: auto; display: flex; gap: 16px; }
    .topbar-c { font-family: var(--mono); font-size: 12px; color: var(--t3); }
    .topbar-c b { color: var(--t2); font-weight: 500; }

    /* ── MAIN GRID ── */
    .grid { display: grid; grid-template-columns: 1fr 300px; min-height: calc(100vh - 45px); }
    .left { padding: 20px 24px; overflow-y: auto; }
    .right { border-left: 1px solid var(--border); padding: 20px; overflow-y: auto; background: var(--bg2); }

    /* ── SECTION ── */
    .sec-title { font-family: var(--mono); font-size: 11px; font-weight: 500; color: var(--t3); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
    .sec { margin-bottom: 28px; }

    /* ── CHAIN CARD ── */
    .chain { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; margin-bottom: 6px; overflow: hidden; }
    .chain-header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; user-select: none; }
    .chain-header:hover { background: var(--bg3); }
    .chain-arrow { color: var(--t3); font-size: 10px; transition: transform .15s; width: 14px; text-align: center; }
    .chain.open .chain-arrow { transform: rotate(90deg); }
    .chain-method { font-family: var(--mono); font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 3px; }
    .m-get { background: rgba(74,222,128,.12); color: var(--green); }
    .m-post { background: rgba(91,156,245,.12); color: var(--blue); }
    .m-put { background: rgba(91,156,245,.12); color: var(--blue); }
    .m-patch { background: rgba(229,166,62,.12); color: var(--amber); }
    .m-delete { background: rgba(232,93,117,.12); color: var(--rose); }
    .chain-name { font-size: 13px; font-weight: 600; color: var(--t1); }
    .chain-route { font-family: var(--mono); font-size: 12px; color: var(--t3); margin-left: auto; }
    .chain-body { display: none; border-top: 1px solid var(--border); }
    .chain.open .chain-body { display: block; }

    /* ── FLOW ROW ── */
    .flow { display: flex; align-items: stretch; }
    .flow-rail { width: 40px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding-left: 16px; }
    .flow-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 14px; flex-shrink: 0; }
    .flow-line { width: 1px; flex: 1; margin-top: 4px; }
    .flow-dot.fe { background: var(--cyan); }  .flow-line.fe { background: var(--cyan); opacity: .18; }
    .flow-dot.be { background: var(--violet); } .flow-line.be { background: var(--violet); opacity: .18; }
    .flow-dot.db { background: var(--green); }  .flow-line.db { background: var(--green); opacity: .18; }
    .flow-content { flex: 1; padding: 8px 14px; min-width: 0; border-bottom: 1px solid var(--border); }
    .flow:last-child .flow-content { border-bottom: none; }
    .flow:last-child .flow-line { display: none; }
    .flow-layer { font-family: var(--mono); font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px; }
    .flow-layer.fe { color: var(--cyan); }
    .flow-layer.be { color: var(--violet); }
    .flow-layer.db { color: var(--green); }
    .flow-fn { font-size: 13px; font-weight: 500; color: var(--t1); }
    .flow-sub { font-size: 11px; color: var(--t3); margin-top: 1px; }

    /* ── LINKS ── */
    a.sl { color: var(--t1); text-decoration: none; transition: color .1s; }
    a.sl:hover { color: var(--cyan); }

    /* ── COMPLEXITY ── */
    .cx { font-family: var(--mono); font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 3px; margin-left: 6px; }
    .cx-low { background: rgba(74,222,128,.1); color: var(--green); }
    .cx-med { background: rgba(229,166,62,.1); color: var(--amber); }
    .cx-high { background: rgba(232,93,117,.12); color: var(--rose); }

    /* ── EXPLAIN ── */
    .xbtn { font-family: var(--mono); font-size: 10px; background: transparent; border: 1px solid var(--border); color: var(--violet); padding: 1px 7px; border-radius: 3px; cursor: pointer; margin-left: 6px; transition: all .1s; }
    .xbtn:hover { border-color: var(--violet); background: rgba(160,126,245,.08); }
    .xbtn:disabled { opacity: .4; cursor: wait; }
    .xres { margin-top: 6px; padding: 10px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 4px; font-size: 12px; line-height: 1.55; color: var(--t2); white-space: pre-wrap; display: none; }
    .xres.vis { display: block; }
    .xres .err { color: var(--rose); }

    /* ── SIDEBAR PANELS ── */
    .panel { margin-bottom: 20px; }
    .panel-title { font-family: var(--mono); font-size: 10px; font-weight: 500; color: var(--t3); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
    .panel-list { background: var(--bg); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
    .panel-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-bottom: 1px solid var(--border); font-size: 12px; }
    .panel-row:last-child { border-bottom: none; }
    .panel-k { color: var(--t2); font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .panel-v { font-family: var(--mono); font-size: 11px; font-weight: 500; color: var(--t1); text-align: right; flex-shrink: 0; margin-left: 8px; }
    .tag-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
    .tag { font-family: var(--mono); font-size: 11px; padding: 2px 7px; background: var(--bg); border: 1px solid var(--border); border-radius: 3px; color: var(--t2); }
    .tag-sub { color: var(--t3); font-size: 10px; margin-left: 3px; }

    /* ── ORPHANS ── */
    .orphan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 6px; }
    .orphan { background: var(--bg2); border: 1px solid var(--border); border-radius: 4px; padding: 10px 12px; }
    .orphan-name { font-size: 13px; font-weight: 500; color: var(--t1); margin-bottom: 2px; }
    .orphan-meta { font-size: 11px; color: var(--t3); }

    /* ── DIAGRAM ── */
    .diagram { background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 14px; margin-top: 8px; overflow-x: auto; }
    .diagram .mermaid { display: flex; justify-content: center; }

    /* ── RESPONSIVE ── */
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
      .right { border-left: none; border-top: 1px solid var(--border); }
      .chain-route { display: none; }
    }
  </style>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'dark', themeVariables: {
      primaryColor: '#2c2c30', primaryTextColor: '#ededef', primaryBorderColor: '#3a3a3f',
      lineColor: '#5b9cf5', secondaryColor: '#19191c', tertiaryColor: '#111113',
      edgeLabelBackground: '#111113',
    }});
  </script>
  <script>
    const methodBodies = ${JSON.stringify(methodBodies)};
    const lmStudioConfig = ${JSON.stringify(lmStudio)};
    const backendApiCandidates = ${JSON.stringify(backendApiCandidates)};
    document.addEventListener('click', e => {
      const hdr = e.target.closest('.chain-header');
      if (hdr) hdr.closest('.chain').classList.toggle('open');
    });
    async function explain(key, btn) {
      const res = btn.closest('.flow-content, .orphan').querySelector('.xres');
      if (!res) return;
      if (res.textContent.trim() && res.classList.contains('vis')) { res.classList.remove('vis'); return; }
      const body = methodBodies[key];
      if (!body) { res.innerHTML = '<span class="err">No method body</span>'; res.classList.add('vis'); return; }
      btn.disabled = true; btn.textContent = '...';
      res.textContent = ''; res.classList.add('vis');
      try {
        let response = null;
        let lastErr = 'No backend candidates configured';

        for (const base of backendApiCandidates) {
          try {
            const r = await fetch(base + '/api/ai/gemma/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [
                  { role: 'system', content: 'Explain this NestJS method in 3-5 bullet points. Focus on what it does, side effects, and edge cases. Plain text, no markdown.' },
                  { role: 'user', content: body }
                ],
                maxTokens: 400,
                temperature: 0.3,
              }),
            });

            if (r.ok) {
              response = await r.json();
              break;
            }

            const text = await r.text();
            lastErr = 'Backend ' + base + ' returned ' + r.status + ': ' + text.slice(0, 180);
          } catch (err) {
            lastErr = err && err.message ? err.message : String(err);
          }
        }

        if (!response) throw new Error(lastErr);
        res.textContent = response.reply || 'No response';
      } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        res.innerHTML = '<span class="err">Explain failed: ' + msg.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
      }
      btn.disabled = false; btn.textContent = 'explain';
    }
  </script>
</head>
<body>
  ${htmlBody(data, traced, hotspots)}
</body>
</html>`;
}

function htmlBody(data, traced, hotspots) {
  const vs = (fp, line, label) => {
    if (!fp) return hEsc(label);
    const p = fp.replace(/\\/g, '/');
    const href = line ? `vscode://file/${p}:${line}` : `vscode://file/${p}`;
    return `<a class="sl" href="${href}" title="${p}:${line || 1}">${hEsc(label)}</a>`;
  };
  const cxBadge = (score) => {
    if (score == null) return '';
    const cls = score <= 3 ? 'cx-low' : score <= 7 ? 'cx-med' : 'cx-high';
    return `<span class="cx ${cls}">${score}</span>`;
  };

  let h = '';

  /* ── TOP BAR ── */
  h += '<div class="topbar">';
  h += '<div class="topbar-path">' + hEsc(data.bucket) + ' / <b>' + hEsc(data.feature) + '</b></div>';
  h += '<div class="topbar-counts">';
  h += '<span class="topbar-c"><b>' + data.endpoints.length + '</b> endpoints</span>';
  h += '<span class="topbar-c"><b>' + data.services.length + '</b> services</span>';
  h += '<span class="topbar-c"><b>' + data.hooks.length + '</b> hooks</span>';
  h += '<span class="topbar-c"><b>' + data.components.length + '</b> components</span>';
  h += '</div></div>';

  h += '<div class="grid"><div class="left">';

  /* ── CHAINS ── */
  h += '<div class="sec"><div class="sec-title">Request chains</div>';

  for (let ci = 0; ci < traced.chains.length; ci++) {
    const chain = traced.chains[ci];
    const mCls = 'm-' + chain.endpoint.method.toLowerCase();
    const openCls = ci < 3 ? ' open' : '';
    h += '<div class="chain' + openCls + '">';
    h += '<div class="chain-header">';
    h += '<span class="chain-arrow">&#9654;</span>';
    h += '<span class="chain-method ' + mCls + '">' + chain.endpoint.method + '</span>';
    h += '<span class="chain-name">' + hEsc(chain.name) + '</span>';
    h += '<span class="chain-route">' + hEsc(chain.endpoint.path) + '</span>';
    h += '</div><div class="chain-body">';

    // Hooks
    for (const hook of chain.hooks) {
      h += '<div class="flow"><div class="flow-rail"><div class="flow-dot fe"></div><div class="flow-line fe"></div></div>';
      h += '<div class="flow-content"><div class="flow-layer fe">hook</div>';
      h += '<div class="flow-fn">' + vs(hook.file, hook.line, hook.name) + '</div>';
      if (hook.hookDeps.length) h += '<div class="flow-sub">uses ' + hook.hookDeps.join(', ') + '</div>';
      h += '</div></div>';
    }

    // Bindings
    for (const b of chain.bindings) {
      h += '<div class="flow"><div class="flow-rail"><div class="flow-dot fe"></div><div class="flow-line fe"></div></div>';
      h += '<div class="flow-content"><div class="flow-layer fe">api</div>';
      h += '<div class="flow-fn">' + vs(b.file, b.line, b.name + '()') + '</div></div></div>';
    }

    // Controller
    h += '<div class="flow"><div class="flow-rail"><div class="flow-dot be"></div><div class="flow-line be"></div></div>';
    h += '<div class="flow-content"><div class="flow-layer be">controller</div>';
    h += '<div class="flow-fn">' + vs(chain.endpoint.file, chain.endpoint.line, chain.endpoint.handler + '()') + '</div></div></div>';

    // Service methods
    for (const sm of chain.svcMethods) {
      h += '<div class="flow"><div class="flow-rail"><div class="flow-dot be"></div><div class="flow-line be"></div></div>';
      const label = sm.methodName ? sm.className + '.' + sm.methodName + '()' : sm.className;
      h += '<div class="flow-content"><div class="flow-layer be">service</div>';
      h += '<div class="flow-fn">' + (sm.method ? vs(sm.method.file, sm.method.line, label) : hEsc(label));
      if (sm.method) h += cxBadge(sm.method.complexity);
      const key = sm.className + '.' + sm.methodName;
      h += ' <button class="xbtn" onclick="explain(\'' + hEsc(key) + '\',this)">explain</button></div>';
      h += '<div class="xres"></div>';
      h += '</div></div>';
    }

    // Database
    if (data.prismaModel) {
      h += '<div class="flow"><div class="flow-rail"><div class="flow-dot db"></div></div>';
      h += '<div class="flow-content"><div class="flow-layer db">database</div>';
      h += '<div class="flow-fn">' + hEsc(data.prismaModel.modelName) + '</div></div></div>';
    }

    h += '</div></div>';
  }

  if (!traced.chains.length) {
    h += '<div style="color:var(--t3);font-size:13px;padding:12px 0">No chains traced.</div>';
  }
  h += '</div>';

  /* ── STANDALONE ── */
  const hasOrphans = traced.orphanHooks.length || traced.orphanBindings.length || traced.standaloneMethods.length;
  if (hasOrphans) {
    h += '<div class="sec"><div class="sec-title">Standalone / Internal</div>';
    h += '<div class="orphan-grid">';
    for (const hook of traced.orphanHooks) {
      h += '<div class="orphan"><div class="orphan-name">' + vs(hook.file, hook.line, hook.name) + '</div>';
      h += '<div class="orphan-meta">hook' + (hook.apiCalls.length ? ' &middot; ' + hook.apiCalls.join(', ') : '') + '</div></div>';
    }
    for (const b of traced.orphanBindings) {
      h += '<div class="orphan"><div class="orphan-name">' + vs(b.file, b.line, b.name + '()') + '</div>';
      h += '<div class="orphan-meta">' + b.method + ' ' + hEsc(b.path) + '</div></div>';
    }
    for (const m of traced.standaloneMethods) {
      const key = m.className + '.' + m.name;
      h += '<div class="orphan"><div class="orphan-name">' + vs(m.file, m.line, m.className + '.' + m.name + '()') + cxBadge(m.complexity);
      h += ' <button class="xbtn" onclick="explain(\'' + hEsc(key) + '\',this)">explain</button></div>';
      h += '<div class="orphan-meta">internal</div><div class="xres"></div></div>';
    }
    h += '</div></div>';
  }

  /* ── COMPONENTS ── */
  if (data.components.length) {
    h += '<div class="sec"><div class="sec-title">Components</div>';
    h += '<div class="orphan-grid">';
    for (const c of data.components) {
      h += '<div class="orphan"><div class="orphan-name">' + vs(c.file, 1, c.name) + '</div><div class="orphan-meta">react component</div></div>';
    }
    h += '</div></div>';
  }

  h += '</div>'; // left

  /* ── RIGHT PANEL ── */
  h += '<div class="right">';

  // Hotspots
  if (hotspots.length) {
    h += '<div class="panel"><div class="panel-title">Complexity</div><div class="panel-list">';
    hotspots.slice(0, 10).forEach(hs => {
      h += '<div class="panel-row"><span class="panel-k">' + vs(hs.file, hs.line, hs.name + '()') + '</span>' + cxBadge(hs.complexity) + '</div>';
    });
    h += '</div></div>';
  }

  // Model fields
  if (data.prismaModel) {
    h += '<div class="panel"><div class="panel-title">' + hEsc(data.prismaModel.modelName) + '</div><div class="panel-list">';
    for (const f of data.prismaModel.fields) {
      let extra = '';
      if (f.isPk) extra = ' <span class="cx cx-low" style="font-size:9px">PK</span>';
      else if (f.isFk) extra = ' <span class="cx cx-med" style="font-size:9px">FK</span>';
      h += '<div class="panel-row"><span class="panel-k">' + hEsc(f.name) + extra + '</span><span class="panel-v">' + hEsc(f.type) + '</span></div>';
    }
    h += '</div></div>';

    if (data.prismaModel.relations.length) {
      h += '<div class="panel"><div class="panel-title">Relations</div><div class="tag-wrap">';
      for (const r of data.prismaModel.relations) {
        const card = r.isArray ? '1:n' : r.isOptional ? '0..1' : '1:1';
        h += '<span class="tag">' + hEsc(r.type) + '<span class="tag-sub">' + card + '</span></span>';
      }
      h += '</div></div>';
    }

    if (data.prismaModels.length > 1) {
      h += '<div class="panel"><div class="panel-title">Also references</div><div class="tag-wrap">';
      data.prismaModels.slice(1).forEach(m => { h += '<span class="tag">' + hEsc(m) + '</span>'; });
      h += '</div></div>';
    }

    h += '<div class="panel"><div class="diagram"><pre class="mermaid">\n' + erDiagram(data.prismaModel) + '\n</pre></div></div>';
  }

  // DTOs
  if (data.dtos.length) {
    for (const dto of data.dtos) {
      h += '<div class="panel"><div class="panel-title">' + hEsc(dto.name) + '</div><div class="panel-list">';
      for (const f of dto.fields) {
        h += '<div class="panel-row"><span class="panel-k">' + hEsc(f.name) + '</span><span class="panel-v">' + hEsc(f.type) + '</span></div>';
      }
      h += '</div></div>';
    }
  }

  h += '</div></div>';
  return h;
}


/* ═══ Main ════════════════════════════════════════════════════════════════ */

function generate() {
  console.log(`\n📊 Generating diagrams for ${bucket}/${feature}...`);

  if (!fs.existsSync(backendDir) && !fs.existsSync(frontendDir)) {
    console.error(`\n❌ Neither backend nor frontend directory found:`);
    console.error(`   Backend:  ${backendDir}`);
    console.error(`   Frontend: ${frontendDir}`);
    process.exit(1);
  }

  const data = collect();

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const base = `${bucket}-${feature.replace(/\//g, '-')}`;
  const mdPath = path.join(OUTPUT_DIR, `${base}.md`);
  const htmlPath = path.join(OUTPUT_DIR, `${base}.html`);

  fs.writeFileSync(mdPath, toMarkdown(data));
  fs.writeFileSync(htmlPath, toHtml(data));

  console.log(`   ✅ ${path.relative(ROOT, mdPath)}`);
  console.log(`   ✅ ${path.relative(ROOT, htmlPath)}`);
  console.log(`\n   📈 ${data.endpoints.length} endpoints · ${data.services.length} services · ${data.hooks.length} hooks · ${data.components.length} components`);
  if (data.prismaModel) console.log(`   📦 Primary model: ${data.prismaModel.modelName}`);
  if (data.prismaModels.length > 1) console.log(`   📦 Also references: ${data.prismaModels.slice(1).join(', ')}`);

  return { mdPath, htmlPath };
}

const { htmlPath } = generate();

if (watchMode) {
  console.log('\n👀 Watching for changes... (Ctrl+C to stop)\n');
  let debounce = null;
  const dirs = [backendDir, frontendDir].filter(d => fs.existsSync(d));

  for (const dir of dirs) {
    fs.watch(dir, { recursive: true }, (_, filename) => {
      if (!filename || !/\.(ts|tsx)$/.test(filename)) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        console.log(`   🔄 ${filename} changed`);
        try { generate(); } catch (err) { console.error('   ⚠️  Error:', err.message); }
      }, 300);
    });
  }

  // Also watch schema
  if (fs.existsSync(SCHEMA_PATH)) {
    fs.watch(SCHEMA_PATH, () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        console.log('   🔄 schema.prisma changed');
        try { generate(); } catch (err) { console.error('   ⚠️  Error:', err.message); }
      }, 300);
    });
  }

  process.on('SIGINT', () => { console.log('\n👋 Stopped.'); process.exit(0); });
} else {
  console.log(`\n💡 Open in browser: ${path.relative(ROOT, htmlPath)}`);
  console.log('💡 Or preview the .md in VS Code (install "Markdown Preview Mermaid Support" ext)');
  console.log('💡 Re-run with --watch to auto-regenerate on file changes\n');
}
