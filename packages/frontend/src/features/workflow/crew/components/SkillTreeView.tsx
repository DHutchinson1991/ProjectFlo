"use client";

import React, { useMemo, useRef, useState } from "react";
import { Box, Typography, alpha, Stack, Fade } from "@mui/material";
import type { PaymentBracket } from "@/features/finance/payment-brackets/types";
import type { SkillRoleMapping } from "@/features/catalog/task-library/types";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface SkillTreeViewProps {
  brackets: PaymentBracket[];
  skillMappings: SkillRoleMapping[];
  roleName: string;
  currencyCode: string;
  formatRate: (
    value: number | string | null | undefined,
    currency: string,
  ) => string;
}

interface HexNodeData {
  id: string;
  type: "tier" | "skill";
  label: string;
  sublabel?: string;
  rateLabel?: string;
  accent: string;
  level: number;
  tierIdx: number; // 0-based index within sorted tiers
  tierTotal: number; // total tiers
  x: number;
  y: number;
  size: number;
  locked: boolean;
  crewCount: number;
  crewNames: string[];
  bracket?: PaymentBracket;
  skillMapping?: SkillRoleMapping;
}

interface EdgeData {
  from: string;
  to: string;
  accent: string;
  type: "trunk" | "branch";
  unlocked: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS — more generous spacing
   ═══════════════════════════════════════════════════════════════════════════ */

const BASE_TIER_SIZE = 48;
const TIER_SIZE_STEP = 9; // each higher tier grows by this
const SKILL_HEX_SIZE = 30;
const TIER_H_GAP = 380; // generous horizontal gap between tiers
const SKILL_ORBIT_Y = 170; // vertical distance tier→skill
const SKILL_X_SPREAD = 100; // horizontal spread between skills
const PAD_LEFT = 180;
const PAD_RIGHT = 180;
const PAD_Y = 80;
const TRUNK_Y = 320; // vertical centre of the trunk

/* ═══════════════════════════════════════════════════════════════════════════
   COLOUR PALETTE
   ═══════════════════════════════════════════════════════════════════════════ */

const LEVEL_COLORS = [
  "#4CAF50", // 1 — green
  "#42A5F5", // 2 — blue
  "#AB47BC", // 3 — purple
  "#FF7043", // 4 — orange
  "#FFD54F", // 5 — gold
  "#FF5252", // 6 — red
];

function tierColor(lvl: number, custom?: string | null): string {
  if (custom) return custom;
  return LEVEL_COLORS[Math.min(lvl, LEVEL_COLORS.length) - 1] ?? "#42A5F5";
}

/* ═══════════════════════════════════════════════════════════════════════════
   SVG ICON PATHS — real icons, not emoji
   ═══════════════════════════════════════════════════════════════════════════ */

// Shield (junior)
const ICON_SHIELD =
  "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z";
// Star (mid)
const ICON_STAR =
  "M12 2l2.94 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 7.06-1.01L12 2z";
// Bolt (senior)
const ICON_BOLT = "M13 2L4 14h7l-2 10 9-12h-7l2-10z";
// Crown (top)
const ICON_CROWN =
  "M2 19h20v3H2v-3zm1-1l2.5-8L9 14l3-10 3 10 3.5-4L21 18H3z";
// Gem (skill)
const ICON_GEM =
  "M12 2L4.5 9.5 12 22l7.5-12.5L12 2zm0 3.58L16.27 10H7.73L12 5.58z";

const TIER_ICONS = [ICON_SHIELD, ICON_STAR, ICON_BOLT, ICON_CROWN];

function tierIcon(idx: number, total: number): string {
  if (idx === total - 1) return ICON_CROWN;
  if (total <= 2) return idx === 0 ? ICON_SHIELD : ICON_CROWN;
  const pick = Math.min(idx, TIER_ICONS.length - 2);
  return TIER_ICONS[pick];
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEX HELPER
   ═══════════════════════════════════════════════════════════════════════════ */

function hexPts(size: number): string {
  const p: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    p.push(`${size * Math.cos(a)},${size * Math.sin(a)}`);
  }
  return p.join(" ");
}

/* ═══════════════════════════════════════════════════════════════════════════
   LAYOUT ENGINE — horizontal, left-to-right, progressive sizing
   ═══════════════════════════════════════════════════════════════════════════ */

function buildLayout(
  brackets: PaymentBracket[],
  skillMappings: SkillRoleMapping[],
  formatRate: SkillTreeViewProps["formatRate"],
  currencyCode: string,
): { nodes: HexNodeData[]; edges: EdgeData[]; width: number; height: number } {
  const sorted = [...brackets].sort((a, b) => a.level - b.level);
  const nodes: HexNodeData[] = [];
  const edges: EdgeData[] = [];
  const total = sorted.length;
  const positions = new Map<
    number,
    { x: number; y: number; accent: string; id: string }
  >();

  sorted.forEach((br, idx) => {
    const accent = tierColor(br.level, br.color);
    const members = br.job_role_assignments ?? [];
    const crewCount = members.length;
    const locked = crewCount === 0;

    // Progressive hex size — junior small, lead big
    const size = BASE_TIER_SIZE + idx * TIER_SIZE_STEP;
    const xPos = PAD_LEFT + idx * TIER_H_GAP;
    const yPos = TRUNK_Y;
    const nodeId = `tier-${br.id}`;
    positions.set(br.id, { x: xPos, y: yPos, accent, id: nodeId });

    const rate = br.hourly_rate;
    const rateStr = rate ? formatRate(rate, currencyCode) : "";
    const rateLabel = rateStr ? `${rateStr}/hr` : "";

    const crewNames = members.map((m) => {
      const f = m.crew_member?.contact?.first_name ?? "";
      const l = m.crew_member?.contact?.last_name ?? "";
      return `${f} ${l}`.trim() || m.crew_member?.contact?.email || "Unknown";
    });

    nodes.push({
      id: nodeId,
      type: "tier",
      label: br.display_name || br.name,
      sublabel: br.description || `Tier ${br.level}`,
      rateLabel,
      accent,
      level: br.level,
      tierIdx: idx,
      tierTotal: total,
      x: xPos,
      y: yPos,
      size,
      locked,
      crewCount,
      crewNames,
      bracket: br,
    });

    // Trunk edge
    if (idx > 0) {
      const prev = sorted[idx - 1];
      const pp = positions.get(prev.id);
      if (pp) {
        edges.push({
          from: pp.id,
          to: nodeId,
          accent,
          type: "trunk",
          unlocked: !locked,
        });
      }
    }

    // Skills — above & below
    const skills = skillMappings.filter(
      (m) => m.payment_bracket_id === br.id && m.is_active,
    );
    if (skills.length > 0) {
      const top: SkillRoleMapping[] = [];
      const bot: SkillRoleMapping[] = [];
      skills.forEach((s, i) => (i % 2 === 0 ? top : bot).push(s));

      const place = (list: SkillRoleMapping[], isTop: boolean) => {
        const startX = xPos - ((list.length - 1) * SKILL_X_SPREAD) / 2;
        list.forEach((skill, si) => {
          const sx = startX + si * SKILL_X_SPREAD;
          const sy = isTop ? yPos - SKILL_ORBIT_Y : yPos + SKILL_ORBIT_Y;
          const sid = `skill-${skill.id}`;
          nodes.push({
            id: sid,
            type: "skill",
            label: skill.skill_name,
            accent,
            level: br.level,
            tierIdx: idx,
            tierTotal: total,
            x: sx,
            y: sy,
            size: SKILL_HEX_SIZE,
            locked: false,
            crewCount: 0,
            crewNames: [],
            skillMapping: skill,
          });
          edges.push({
            from: nodeId,
            to: sid,
            accent,
            type: "branch",
            unlocked: true,
          });
        });
      };
      place(top, true);
      place(bot, false);
    }
  });

  const xs = nodes.map((n) => n.x + n.size + 100);
  const ys = nodes.map((n) => n.y + n.size + 70);
  const width = Math.max(...xs, 600) + PAD_RIGHT;
  const height = Math.max(...ys, 400) + PAD_Y;
  return { nodes, edges, width, height };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SVG DEFS
   ═══════════════════════════════════════════════════════════════════════════ */

const SvgDefs: React.FC<{ tiers: HexNodeData[] }> = ({ tiers }) => (
  <defs>
    {/* Glow filters */}
    <filter id="glow-lg" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="8" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glow-sm" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="4" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    {/* Per-tier radial gradient fills */}
    {tiers.map((t) => (
      <React.Fragment key={t.id}>
        <radialGradient id={`fill-${t.id}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={alpha(t.accent, 0.2)} />
          <stop offset="100%" stopColor={alpha(t.accent, 0.04)} />
        </radialGradient>
        <radialGradient id={`ring-${t.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={t.accent} stopOpacity={0.25} />
          <stop offset="100%" stopColor={t.accent} stopOpacity={0} />
        </radialGradient>
      </React.Fragment>
    ))}

    {/* Subtle background vignette */}
    <radialGradient id="bg-vig" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stopColor="rgba(25,25,55,0.2)" />
      <stop offset="100%" stopColor="transparent" />
    </radialGradient>

    {/* Arrow marker for trunk */}
    <marker
      id="arrow"
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M0,2 L8,5 L0,8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
    </marker>
  </defs>
);

/* ═══════════════════════════════════════════════════════════════════════════
   TIER HEX NODE — progressive size, real icons, richer rings
   ═══════════════════════════════════════════════════════════════════════════ */

const TierHexNode: React.FC<{
  node: HexNodeData;
  hovered: boolean;
  onHover: (id: string | null) => void;
}> = ({ node, hovered, onHover }) => {
  const s = node.size;
  const isTop = node.tierIdx === node.tierTotal - 1;
  const progress = node.tierTotal > 1 ? node.tierIdx / (node.tierTotal - 1) : 1;
  const iconPath = tierIcon(node.tierIdx, node.tierTotal);
  const iconScale = (s / 56) * (0.6 + progress * 0.35); // icon grows with tier

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: "pointer" }}
    >
      {/* ── Ambient aura ── */}
      {!node.locked && (
        <circle
          r={s + 24}
          fill={`url(#ring-${node.id})`}
          opacity={hovered ? 0.7 : 0.35}
          style={{ transition: "opacity 0.4s" }}
        />
      )}

      {/* ── Decorative outer hex ring (rotated 15°) ── */}
      {!node.locked && (
        <g
          opacity={hovered ? 0.45 : 0.12}
          style={{ transition: "opacity 0.4s" }}
        >
          <polygon
            points={hexPts(s + 16)}
            fill="none"
            stroke={node.accent}
            strokeWidth={1}
            transform="rotate(15)"
            style={{ filter: `drop-shadow(0 0 6px ${node.accent})` }}
          />
        </g>
      )}

      {/* ── Pulsing outer ring on hover ── */}
      {hovered && (
        <polygon
          points={hexPts(s + 22)}
          fill="none"
          stroke={node.accent}
          strokeWidth={1.5}
          opacity={0.35}
        >
          <animate
            attributeName="opacity"
            values="0.1;0.45;0.1"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </polygon>
      )}

      {/* ── Main hex ── */}
      <polygon
        points={hexPts(s)}
        fill={node.locked ? "rgba(20,20,40,0.7)" : `url(#fill-${node.id})`}
        stroke={node.accent}
        strokeWidth={isTop ? 3 : 2.5}
        opacity={node.locked ? 0.4 : 1}
        style={
          !node.locked
            ? {
                filter: `drop-shadow(0 0 ${6 + progress * 8}px ${alpha(node.accent, 0.5)})`,
                transition: "filter 0.4s",
              }
            : { transition: "opacity 0.4s" }
        }
      />

      {/* ── Inner accent hex ── */}
      {!node.locked && (
        <polygon
          points={hexPts(s - 8)}
          fill="none"
          stroke={node.accent}
          strokeWidth={0.6}
          opacity={hovered ? 0.5 : 0.15}
          style={{ transition: "opacity 0.4s" }}
        />
      )}

      {/* ── SVG icon centre ── */}
      <g transform={`translate(-12,-12) scale(${iconScale})`}>
        <path
          d={node.locked ? ICON_SHIELD : iconPath}
          fill={node.locked ? alpha("#fff", 0.2) : node.accent}
          opacity={node.locked ? 0.5 : hovered ? 1 : 0.7}
          style={
            !node.locked
              ? {
                  filter: `drop-shadow(0 0 4px ${node.accent})`,
                  transition: "opacity 0.3s",
                }
              : { transition: "opacity 0.3s" }
          }
        />
      </g>

      {/* ── Level badge (top-left) ── */}
      <g transform={`translate(${-s + 2},${-s + 2})`}>
        <rect
          x={-14}
          y={-8}
          width={28}
          height={16}
          rx={4}
          fill={alpha(node.accent, node.locked ? 0.15 : 0.25)}
          stroke={node.accent}
          strokeWidth={0.8}
          opacity={node.locked ? 0.4 : 0.8}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill={node.locked ? alpha("#fff", 0.3) : node.accent}
          fontSize={8.5}
          fontWeight={800}
          fontFamily="system-ui"
          letterSpacing={1}
        >
          LVL {node.level}
        </text>
      </g>

      {/* ── Crew count badge (top-right) ── */}
      {node.crewCount > 0 && (
        <g transform={`translate(${s - 4},${-s + 2})`}>
          <circle r={11} fill={node.accent} opacity={0.9} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize={10}
            fontWeight={700}
            fontFamily="system-ui"
          >
            {node.crewCount}
          </text>
        </g>
      )}

      {/* ── Tier name ABOVE ── */}
      <text
        textAnchor="middle"
        y={-(s + 20)}
        fill={node.accent}
        fontSize={13}
        fontWeight={700}
        fontFamily="system-ui"
        opacity={node.locked ? 0.4 : 1}
        style={
          !node.locked
            ? { filter: `drop-shadow(0 0 8px ${alpha(node.accent, 0.45)})` }
            : undefined
        }
      >
        {node.label.length > 24 ? node.label.slice(0, 23) + "…" : node.label}
      </text>

      {/* ── Rate BELOW ── */}
      {node.rateLabel && (
        <text
          textAnchor="middle"
          y={s + 20}
          fill={node.locked ? alpha("#fff", 0.25) : alpha("#fff", 0.75)}
          fontSize={11}
          fontWeight={600}
          fontFamily="system-ui"
        >
          {node.rateLabel}
        </text>
      )}

      {/* ── Description ── */}
      {node.sublabel && (
        <text
          textAnchor="middle"
          y={s + (node.rateLabel ? 36 : 20)}
          fill={alpha("#fff", 0.25)}
          fontSize={9}
          fontFamily="system-ui"
        >
          {node.sublabel.length > 32
            ? node.sublabel.slice(0, 31) + "…"
            : node.sublabel}
        </text>
      )}

      {/* ── Crew avatar initials ── */}
      {node.crewNames.length > 0 && (
        <g>
          {node.crewNames.slice(0, 5).map((name, i) => {
            const vis = Math.min(node.crewNames.length, 5);
            const sp = 17;
            const cx = -((vis - 1) * sp) / 2 + i * sp;
            const cy = s + (node.rateLabel ? 52 : 38);
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={8}
                  fill={alpha(node.accent, 0.2)}
                  stroke={node.accent}
                  strokeWidth={0.8}
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={7}
                  fontWeight={600}
                  fontFamily="system-ui"
                >
                  {name.charAt(0).toUpperCase()}
                </text>
              </g>
            );
          })}
          {node.crewNames.length > 5 && (
            <text
              x={((Math.min(5, node.crewNames.length) - 1) * 17) / 2 + 18}
              y={s + (node.rateLabel ? 52 : 38)}
              textAnchor="start"
              dominantBaseline="central"
              fill={alpha("#fff", 0.35)}
              fontSize={8}
              fontFamily="system-ui"
            >
              +{node.crewNames.length - 5}
            </text>
          )}
        </g>
      )}
    </g>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SKILL HEX NODE — gem icon, proper label spacing
   ═══════════════════════════════════════════════════════════════════════════ */

const SkillHexNode: React.FC<{
  node: HexNodeData;
  hovered: boolean;
  onHover: (id: string | null) => void;
}> = ({ node, hovered, onHover }) => {
  const s = node.size;
  const iconSc = s / 38;

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: "pointer" }}
    >
      {/* Glow on hover */}
      {hovered && (
        <polygon
          points={hexPts(s + 10)}
          fill="none"
          stroke={node.accent}
          strokeWidth={1.2}
          opacity={0.45}
          style={{ filter: `drop-shadow(0 0 8px ${node.accent})` }}
        >
          <animate
            attributeName="opacity"
            values="0.15;0.5;0.15"
            dur="2s"
            repeatCount="indefinite"
          />
        </polygon>
      )}

      {/* Main hex */}
      <polygon
        points={hexPts(s)}
        fill={alpha(node.accent, hovered ? 0.14 : 0.05)}
        stroke={node.accent}
        strokeWidth={1.4}
        opacity={hovered ? 1 : 0.65}
        style={{
          filter: hovered
            ? `drop-shadow(0 0 6px ${alpha(node.accent, 0.5)})`
            : undefined,
          transition: "all 0.35s",
        }}
      />

      {/* Gem icon */}
      <g transform={`translate(-12,-12) scale(${iconSc})`}>
        <path
          d={ICON_GEM}
          fill={node.accent}
          opacity={hovered ? 0.85 : 0.35}
          style={{ transition: "opacity 0.3s" }}
        />
      </g>

      {/* Skill name BELOW */}
      <text
        textAnchor="middle"
        y={s + 16}
        fill={hovered ? "#fff" : alpha("#fff", 0.6)}
        fontSize={10}
        fontWeight={600}
        fontFamily="system-ui"
        style={{ transition: "fill 0.3s" }}
      >
        {node.label.length > 20 ? node.label.slice(0, 19) + "…" : node.label}
      </text>
    </g>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   EDGES — gradient trunk with arrow, bezier branches with dots
   ═══════════════════════════════════════════════════════════════════════════ */

const TrunkEdge: React.FC<{
  edge: EdgeData;
  from: HexNodeData;
  to: HexNodeData;
  hi: boolean;
}> = ({ edge, from, to, hi }) => {
  // Offset start/end so path exits and enters OUTSIDE the hex bodies
  const fromSize = from.size + 12;
  const toSize = to.size + 12;
  const x1 = from.x + fromSize;
  const x2 = to.x - toSize;
  const y1 = from.y;
  const y2 = to.y;

  // Slight vertical wave so it's not perfectly flat
  const midX = (x1 + x2) / 2;
  const wave = 18;
  const pathD = `M${x1},${y1} C${midX},${y1 - wave} ${midX},${y2 + wave} ${x2},${y2}`;

  // Use a blended midpoint color for the mid section
  const fromC = from.accent;
  const toC = to.accent;

  return (
    <g>
      {/* Broad soft glow */}
      <path
        d={pathD}
        fill="none"
        stroke={fromC}
        strokeWidth={hi ? 18 : 10}
        opacity={hi ? 0.15 : 0.06}
        strokeLinecap="round"
      />

      {/* Solid faint line underneath dashes for continuity */}
      <path
        d={pathD}
        fill="none"
        stroke={toC}
        strokeWidth={hi ? 2.5 : 1.5}
        opacity={hi ? 0.4 : 0.15}
        strokeLinecap="round"
        style={{ transition: "opacity 0.4s" }}
      />

      {/* Main dashed path — highly visible */}
      <path
        d={pathD}
        fill="none"
        stroke={fromC}
        strokeWidth={hi ? 3.5 : 2.5}
        opacity={hi ? 1 : edge.unlocked ? 0.7 : 0.25}
        strokeLinecap="round"
        strokeDasharray={edge.unlocked ? "8,10" : "4,12"}
        markerEnd="url(#arrow)"
        style={{ transition: "opacity 0.4s, stroke-width 0.4s" }}
      />

      {/* Second dashed layer in "to" colour for gradient feel */}
      <path
        d={pathD}
        fill="none"
        stroke={toC}
        strokeWidth={hi ? 3.5 : 2.5}
        opacity={hi ? 0.6 : edge.unlocked ? 0.35 : 0.1}
        strokeLinecap="round"
        strokeDasharray={edge.unlocked ? "8,10" : "4,12"}
        strokeDashoffset={8}
        style={{ transition: "opacity 0.4s, stroke-width 0.4s" }}
      />

      {/* Start connector dot */}
      <circle cx={x1} cy={y1} r={hi ? 5 : 4} fill={fromC} opacity={edge.unlocked ? 0.8 : 0.3}>
        {edge.unlocked && (
          <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" />
        )}
      </circle>

      {/* End connector dot */}
      <circle cx={x2} cy={y2} r={hi ? 5 : 4} fill={toC} opacity={edge.unlocked ? 0.8 : 0.3}>
        {edge.unlocked && (
          <animate attributeName="r" values="3;5;3" dur="3s" begin="1.5s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Flowing energy orbs */}
      {edge.unlocked && (
        <>
          <circle r={4} fill={toC} opacity={0.9}>
            <animateMotion dur="3s" repeatCount="indefinite" path={pathD} />
            <animate attributeName="opacity" values="0;0.9;0" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle r={2.5} fill="#fff" opacity={0.7}>
            <animateMotion dur="3s" repeatCount="indefinite" begin="1.5s" path={pathD} />
            <animate attributeName="opacity" values="0;0.8;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </g>
  );
};

const BranchEdge: React.FC<{
  edge: EdgeData;
  from: HexNodeData;
  to: HexNodeData;
  hi: boolean;
}> = ({ edge, from, to, hi }) => {
  // Smooth vertical bezier
  const my = from.y + (to.y - from.y) * 0.55;
  return (
    <g>
      {/* Glow behind */}
      <path
        d={`M${from.x},${from.y} C${from.x},${my} ${to.x},${my} ${to.x},${to.y}`}
        fill="none"
        stroke={edge.accent}
        strokeWidth={hi ? 4 : 2}
        opacity={hi ? 0.08 : 0.03}
        style={{ filter: "blur(3px)" }}
      />
      <path
        d={`M${from.x},${from.y} C${from.x},${my} ${to.x},${my} ${to.x},${to.y}`}
        fill="none"
        stroke={edge.accent}
        strokeWidth={hi ? 1.6 : 0.9}
        opacity={hi ? 0.55 : 0.15}
        strokeDasharray="4,5"
        style={{ transition: "opacity 0.4s, stroke-width 0.4s" }}
      />
      {/* Small dot at skill end */}
      {hi && (
        <circle cx={to.x} cy={to.y} r={3} fill={edge.accent} opacity={0.5}>
          <animate
            attributeName="r"
            values="2;4;2"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
};

const EdgeLine: React.FC<{
  edge: EdgeData;
  nodes: Map<string, HexNodeData>;
  hoveredId: string | null;
}> = ({ edge, nodes, hoveredId }) => {
  const f = nodes.get(edge.from);
  const t = nodes.get(edge.to);
  if (!f || !t) return null;
  const hi = hoveredId === edge.from || hoveredId === edge.to;
  return edge.type === "trunk" ? (
    <TrunkEdge edge={edge} from={f} to={t} hi={hi} />
  ) : (
    <BranchEdge edge={edge} from={f} to={t} hi={hi} />
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TOOLTIP
   ═══════════════════════════════════════════════════════════════════════════ */

const NodeTooltip: React.FC<{
  node: HexNodeData | null;
  formatRate: SkillTreeViewProps["formatRate"];
  currencyCode: string;
}> = ({ node, formatRate, currencyCode }) => {
  if (!node) return null;
  const isTier = node.type === "tier";
  return (
    <Fade in={!!node}>
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 260,
          bgcolor: "rgba(10,10,28,0.96)",
          border: `1px solid ${alpha(node.accent, 0.25)}`,
          borderLeft: `3px solid ${node.accent}`,
          borderRadius: 2,
          p: 2,
          backdropFilter: "blur(16px)",
          boxShadow: `0 4px 24px ${alpha(node.accent, 0.1)}`,
          zIndex: 10,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          sx={{ color: node.accent, mb: 0.25 }}
        >
          {node.label}
        </Typography>
        {isTier && node.bracket ? (
          <>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Tier {node.level}
              {node.bracket.description
                ? ` — ${node.bracket.description}`
                : ""}
            </Typography>
            <Box sx={{ mt: 1.5, display: "flex", gap: 2 }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Hourly
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ color: node.accent }}
                >
                  {formatRate(node.bracket.hourly_rate, currencyCode)}
                </Typography>
              </Box>
              {node.bracket.day_rate && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Day
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatRate(node.bracket.day_rate, currencyCode)}
                  </Typography>
                </Box>
              )}
              {node.bracket.overtime_rate && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    OT
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatRate(node.bracket.overtime_rate, currencyCode)}
                  </Typography>
                </Box>
              )}
            </Box>
            {node.crewNames.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  display="block"
                  sx={{ mb: 0.5 }}
                >
                  Crew ({node.crewNames.length})
                </Typography>
                <Stack spacing={0.25}>
                  {node.crewNames.map((n, i) => (
                    <Typography key={i} variant="caption" color="text.primary">
                      {n}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
            {node.locked && (
              <Typography
                variant="caption"
                color="warning.main"
                sx={{ mt: 1, display: "block", fontStyle: "italic" }}
              >
                No crew assigned — tier locked
              </Typography>
            )}
          </>
        ) : (
          <>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Skill — mapped to Tier {node.level}
            </Typography>
            {node.skillMapping?.job_role && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.5 }}
              >
                Role:{" "}
                {node.skillMapping.job_role.display_name ??
                  node.skillMapping.job_role.name}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Fade>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   BACKGROUNDS
   ═══════════════════════════════════════════════════════════════════════════ */

const ParticleBackground: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const pts = useMemo(() => {
    const a: { x: number; y: number; r: number; d: number; dl: number }[] = [];
    for (let i = 0; i < 20; i++)
      a.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1,
        d: 5 + Math.random() * 6,
        dl: Math.random() * 7,
      });
    return a;
  }, [w, h]);

  return (
    <g opacity={0.18}>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#fff">
          <animate
            attributeName="opacity"
            values="0;0.4;0"
            dur={`${p.d}s`}
            begin={`${p.dl}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  );
};

const GridBg: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const dots = useMemo(() => {
    const a: { x: number; y: number }[] = [];
    const sp = 50;
    for (let r = 0; r < h / sp + 1; r++)
      for (let c = 0; c < w / sp + 1; c++)
        a.push({ x: c * sp + (r % 2 ? sp / 2 : 0), y: r * sp });
    return a;
  }, [w, h]);

  return (
    <g opacity={0.04}>
      {dots.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={0.8} fill="#fff" />
      ))}
    </g>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SkillTreeView({
  brackets,
  skillMappings,
  roleName,
  currencyCode,
  formatRate,
}: SkillTreeViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes, edges, width, height } = useMemo(
    () => buildLayout(brackets, skillMappings, formatRate, currencyCode),
    [brackets, skillMappings, formatRate, currencyCode],
  );

  const nodeMap = useMemo(() => {
    const m = new Map<string, HexNodeData>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const tierNodes = useMemo(
    () => nodes.filter((n) => n.type === "tier"),
    [nodes],
  );

  const hoveredNode = hoveredId ? nodeMap.get(hoveredId) ?? null : null;

  const connIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const s = new Set<string>();
    s.add(hoveredId);
    edges.forEach((e) => {
      if (e.from === hoveredId) s.add(e.to);
      if (e.to === hoveredId) s.add(e.from);
    });
    return s;
  }, [hoveredId, edges]);

  if (brackets.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
        <Typography variant="h6" gutterBottom>
          No tiers configured for {roleName}
        </Typography>
        <Typography variant="body2">
          Create payment bracket tiers in the Payment Brackets tab to see the
          skill tree.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        overflow: "auto",
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha("#fff", 0.06),
        bgcolor: "#0d0d1a",
        background:
          "linear-gradient(135deg, #0d0d1a 0%, #0f1025 40%, #12122a 100%)",
        minHeight: 460,
        "&::-webkit-scrollbar": { height: 6, width: 6 },
        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: alpha("#fff", 0.12),
          borderRadius: 3,
        },
      }}
    >
      {/* Tooltip */}
      <NodeTooltip
        node={hoveredNode}
        formatRate={formatRate}
        currencyCode={currencyCode}
      />

      {/* Role title */}
      <Box sx={{ position: "absolute", top: 16, left: 24, zIndex: 5 }}>
        <Typography
          variant="overline"
          sx={{
            color: alpha("#fff", 0.2),
            letterSpacing: 5,
            fontSize: "0.55rem",
          }}
        >
          SKILL TREE
        </Typography>
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{
            color: alpha("#fff", 0.85),
            textShadow: "0 0 30px rgba(100,100,255,0.2)",
            letterSpacing: 0.5,
          }}
        >
          {roleName}
        </Typography>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          position: "absolute",
          bottom: 12,
          left: 24,
          zIndex: 5,
          display: "flex",
          gap: 2,
          alignItems: "center",
          bgcolor: alpha("#000", 0.35),
          px: 1.5,
          py: 0.4,
          borderRadius: 1,
        }}
      >
        {[
          { l: "Tier", c: "#66BB6A", sz: 10, bw: 2 },
          { l: "Skill", c: "#42A5F5", sz: 7, bw: 1.5 },
        ].map(({ l, c, sz, bw }) => (
          <Stack key={l} direction="row" spacing={0.5} alignItems="center">
            <Box
              sx={{
                width: sz,
                height: sz,
                border: `${bw}px solid ${c}`,
                clipPath:
                  "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
                bgcolor: alpha(c, 0.2),
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: alpha("#fff", 0.3), fontSize: "0.6rem" }}
            >
              {l}
            </Typography>
          </Stack>
        ))}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              width: 16,
              height: 1.5,
              background: "linear-gradient(90deg,#4CAF50,#FF7043)",
              borderRadius: 1,
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: alpha("#fff", 0.3), fontSize: "0.6rem" }}
          >
            Progression
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#66BB6A" }}
          />
          <Typography
            variant="caption"
            sx={{ color: alpha("#fff", 0.3), fontSize: "0.6rem" }}
          >
            Energy
          </Typography>
        </Stack>
      </Box>

      {/* SVG canvas */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", minWidth: width }}
      >
        <SvgDefs tiers={tierNodes} />
        <rect width={width} height={height} fill="url(#bg-vig)" />
        <GridBg w={width} h={height} />
        <ParticleBackground w={width} h={height} />

        {edges.map((e, i) => (
          <EdgeLine key={i} edge={e} nodes={nodeMap} hoveredId={hoveredId} />
        ))}

        {nodes.map((n) =>
          n.type === "tier" ? (
            <TierHexNode
              key={n.id}
              node={n}
              hovered={connIds.has(n.id)}
              onHover={setHoveredId}
            />
          ) : (
            <SkillHexNode
              key={n.id}
              node={n}
              hovered={connIds.has(n.id)}
              onHover={setHoveredId}
            />
          ),
        )}
      </svg>
    </Box>
  );
}
