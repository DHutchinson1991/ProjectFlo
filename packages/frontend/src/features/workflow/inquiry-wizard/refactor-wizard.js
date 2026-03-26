const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'packages/frontend/src/features/workflow/inquiry-wizard');

// To be run from workspace root
async function main() {
    const wizardDir = path.join(process.cwd(), 'packages/frontend/src/features/workflow/inquiry-wizard');
    
    const moves = [
        ['lib/wizard-constants.ts', 'constants/wizard-config.ts'],
        ['lib/wizard-animations.ts', 'constants/animations.ts'],
        ['lib/wizard-utils.ts', 'selectors/wizard-navigation.ts'],
        ['components/payment-terms-formatters.ts', 'formatters/payment-terms.ts']
    ];

    // Ensure dirs exist
    ['constants', 'selectors', 'formatters', 'components/steps'].forEach(d => {
        const full = path.join(wizardDir, d);
        if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
    });

    // Handle types
    const libTypesContext = fs.readFileSync(path.join(wizardDir, 'lib/wizard-types.ts'), 'utf8');
    const existingTypes = fs.readFileSync(path.join(wizardDir, 'types/index.ts'), 'utf8');
    fs.writeFileSync(path.join(wizardDir, 'types/index.ts'), existingTypes + '\n' + libTypesContext);
    fs.unlinkSync(path.join(wizardDir, 'lib/wizard-types.ts'));
    
    // Execute explicit moves
    for (const [from, to] of moves) {
        if (fs.existsSync(path.join(wizardDir, from))) {
            fs.renameSync(path.join(wizardDir, from), path.join(wizardDir, to));
        }
    }
    
    try {
      fs.rmdirSync(path.join(wizardDir, 'lib'));
    } catch(e) {} // ignore if not empty

    // Move and rename components/*Screen.tsx -> steps/*Step.tsx
    const compDir = path.join(wizardDir, 'components');
    const files = fs.readdirSync(compDir);
    const screenToStep = {};
    for (const f of files) {
        if (f.endsWith('Screen.tsx') && f !== 'ReviewConflictPanel.tsx' && f !== 'ReviewDataSections.tsx') {
            const newName = f.replace('Screen.tsx', 'Step.tsx');
            screenToStep[f.replace('.tsx', '')] = newName.replace('.tsx', '');
            fs.renameSync(path.join(compDir, f), path.join(compDir, 'steps', newName));
        }
    }

    // Now loop over everything and update imports/contents
    function processDir(d) {
        const entries = fs.readdirSync(d);
        for (const e of entries) {
            const full = path.join(d, e);
            if (fs.statSync(full).isDirectory()) {
                processDir(full);
            } else if (f.endsWith('.ts') || e.endsWith('.tsx')) {
                let content = fs.readFileSync(full, 'utf8');
                let changed = false;

                // Update paths for constants/animations
                const updates = [
                    [/['"](\.\.\/)*lib\/wizard-types['"]/g, "'../types'"],
                    [/['"](\.\/)*lib\/wizard-types['"]/g, "'./types'"],
                    [/['"](\.\.\/)*lib\/wizard-constants['"]/g, "'../constants/wizard-config'"],
                    [/['"](\.\/)*lib\/wizard-constants['"]/g, "'./constants/wizard-config'"],
                    [/['"](\.\.\/)*lib\/wizard-animations['"]/g, "'../constants/animations'"],
                    [/['"](\.\/)*lib\/wizard-animations['"]/g, "'./constants/animations'"],
                    [/['"](\.\.\/)*lib\/wizard-utils['"]/g, "'../selectors/wizard-navigation'"],
                    [/['"](\.\/)*lib\/wizard-utils['"]/g, "'./selectors/wizard-navigation'"],
                    [/['"](\.\.\/)?components\/payment-terms-formatters['"]/g, "'../formatters/payment-terms'"],
                    [/['"](\.\/)?components\/payment-terms-formatters['"]/g, "'./formatters/payment-terms'"],
                ];

                for (const [re, repl] of updates) {
                    if (re.test(content)) {
                        content = content.replace(re, repl);
                        changed = true;
                    }
                }
                
                // For components index or screens updating components/*Screen
                for (const [oldC, newC] of Object.entries(screenToStep)) {
                    // Imports like import x from './BudgetScreen' or '../components/BudgetScreen'
                    const reImport = new RegExp(`['"](?:\\.\\/)?(?:\\.\\.\\/)*(?:components\\/)?${oldC}['"]`, 'g');
                    if (reImport.test(content)) {
                        const relPath = full.includes(path.join('components', 'steps')) ? `'./${newC}'` 
                                      : full.includes('screens') ? `'../components/steps/${newC}'`
                                      : full.includes('components') ? `'./steps/${newC}'`
                                      : `'../components/steps/${newC}'`; 
                        
                        // Let's just blindly replace the base occurrence if it's the exact match in import paths, 
                        // but it's simpler to do string replacement based on relative depth...
                        // Actually let's use a simpler heuristic for imports
                    }
                }
            }
        }
    }
}
main();
