let level = 1;
let shouldFit = true;
let nodePositions = {};  // Saved positions from last render (for animation)
let basePositions = {};  // Dagre-computed positions, locked after first layout
const exNodes = {}, exEdges = {};

// ── Metric bar HTML helpers ──
function barColor(v) { return v > 85 ? '#f44336' : v > 60 ? '#ffab00' : '#4caf50'; }

function metricBar(label, value) {
  if (!value) return '';
  return '<div class="mr"><span class="ml">' + label + '</span>' +
    '<div class="mb"><div class="mf" style="width:' + value + '%;background:' + barColor(value) + '"></div></div>' +
    '<span class="mv">' + value + '%</span></div>';
}

function metricBars(m) {
  if (!m) return '';
  return '<div class="metrics">' +
    metricBar('CPU', m.cpu) + metricBar('RAM', m.ram) +
    metricBar('NET', m.net) + metricBar('STR', m.stor) + '</div>';
}

function miniMetricBars(m) {
  if (!m) return '';
  return '<div class="metrics mini">' +
    metricBar('C', m.cpu) + metricBar('R', m.ram) + '</div>';
}

// Compute effective status: worst of node's own status and its detail children
const STATUS_RANK = { healthy: 0, warning: 1, degraded: 2 };
function effectiveStatus(node) {
  let worst = node.status || 'healthy';
  const details = GRAPH.details[node.id];
  if (details) {
    details.forEach(d => {
      const s = d.status || 'healthy';
      if (STATUS_RANK[s] > STATUS_RANK[worst]) worst = s;
    });
  }
  return worst;
}

function statusLabelClass(status) {
  if (status === 'degraded') return ' is-degraded';
  if (status === 'warning') return ' is-warning';
  return ' is-healthy';
}

function statusNodeClass(status) {
  if (status === 'degraded') return ' degraded';
  if (status === 'warning') return ' warning';
  return ' healthy';
}

function infraLabelHtml(inf) {
  return '<div class="nd-label infra-label' + statusLabelClass(inf.status) + '">' +
    '<div class="nd-head"><span class="sd ' + (inf.status || 'healthy') + '"></span>' +
    '<span class="nd-name">' + inf.name + '</span></div>' +
    '<div class="nd-type">' + inf.type + '</div>' +
    metricBars(inf.metrics) + '</div>';
}

function detailLabelHtml(d) {
  let html = '<div class="nd-label detail-label' + statusLabelClass(d.status) + '">' +
    '<div class="nd-head">';
  html += '<span class="sd ' + (d.status || 'healthy') + '"></span>';
  html += '<span class="nd-name">' + d.name + '</span>';
  if (d.meta) html += '<span class="nd-meta">' + d.meta + '</span>';
  html += '</div>';
  if (d.metrics) html += miniMetricBars(d.metrics);
  html += '</div>';
  return html;
}

// ── Cytoscape stylesheet ──
const cyStyle = [
  { selector: 'node', style: {
    'label': 'data(label)',
    'text-valign': 'center',
    'text-halign': 'center',
    'font-size': '10px',
    'font-weight': 600,
    'color': '#c9d1d9',
    'text-wrap': 'wrap',
    'text-max-width': '140px',
    'background-color': '#161b22',
    'border-width': 1,
    'border-color': '#30363d',
    'width': 160,
    'height': 30,
    'shape': 'round-rectangle',
    'text-outline-color': '#161b22',
    'text-outline-width': 1
  }},
  { selector: 'node.service', style: { 'background-color': '#0f1a12' }},
  { selector: 'node.external', style: { 'background-color': '#0f1a12' }},
  { selector: 'node.database', style: { 'background-color': '#0f1a12' }},
  { selector: 'node.infra', style: { 'background-color': '#0f1a12' }},
  { selector: 'node.current', style: {
    'background-color': '#0d1f0d', 'border-width': 2, 'border-color': '#238636',
    'color': '#3fb950', 'font-size': '12px', 'font-weight': 700,
    'width': 240, 'height': 50, 'text-max-width': '220px'
  }},
  { selector: 'node.upstream', style: {
    'background-color': '#0f1a12', 'width': 170, 'height': 34
  }},
  { selector: 'node.downstream', style: {
    'background-color': '#0f1a12', 'width': 170, 'height': 34
  }},
  { selector: 'node.detail', style: {
    'label': '', 'background-color': '#0d1117',
    'width': 150, 'height': 28
  }},
  { selector: 'node.detail-metrics', style: { 'height': 42 }},
  { selector: 'node.path-node', style: {
    'label': '', 'background-color': '#0d1117',
    'width': 155, 'height': 50
  }},
  { selector: 'node.path-node-short', style: { 'height': 32 }},
  { selector: 'node.healthy', style: { 'border-color': '#2ea04366', 'border-width': 1 }},
  { selector: 'node.path-node.healthy', style: { 'background-color': '#0d150d' }},
  { selector: 'node.detail.healthy', style: { 'border-color': '#2ea04333' }},
  { selector: 'node.warning', style: { 'border-color': '#d4a017', 'border-width': 2, 'background-color': '#1a1708' }},
  { selector: 'node.path-node.warning', style: { 'background-color': '#1a1708' }},
  { selector: 'node.detail.warning', style: { 'border-color': '#d4a01733' }},
  { selector: 'node.degraded', style: { 'border-color': '#f85149', 'border-width': 2, 'background-color': '#1a0d0d' }},
  { selector: 'node.path-node.degraded', style: { 'background-color': '#1a0d0d' }},
  { selector: 'node.detail.degraded', style: { 'border-color': '#f8514933' }},
{ selector: 'node.expandable', style: { 'cursor': 'pointer' }},
  // Edges — bezier curves adapt to layout changes gracefully
  { selector: 'edge', style: {
    'width': 1.5, 'line-color': '#2ea04344', 'target-arrow-color': '#2ea04344',
    'target-arrow-shape': 'triangle', 'arrow-scale': 0.6,
    'curve-style': 'bezier',
    'label': 'data(label)', 'font-size': '9px', 'color': '#3fb950',
    'text-background-color': '#0d1117', 'text-background-opacity': 0.8,
    'text-background-padding': '3px', 'text-background-shape': 'round-rectangle',
    'font-weight': 700
  }},
  { selector: 'edge.warning', style: {
    'line-color': '#d4a01766', 'target-arrow-color': '#d4a01766', 'color': '#d4a017'
  }},
  { selector: 'edge.degraded', style: {
    'line-color': '#f8514966', 'target-arrow-color': '#f8514966', 'color': '#f85149'
  }},
  { selector: 'edge.cross', style: { 'line-style': 'dashed', 'width': 1, 'opacity': 0.35 }},
  { selector: 'edge.thin', style: { 'width': 1 }},
  { selector: 'edge.infra-path', style: { 'width': 1, 'line-style': 'dotted' }}
];

// ── Cytoscape instance ──
const cy = cytoscape({
  container: document.getElementById('cy'),
  style: cyStyle,
  elements: [],
  layout: { name: 'preset' },
  userZoomingEnabled: true,
  userPanningEnabled: true,
  boxSelectionEnabled: false
});

// ── Register HTML label overlays ──
cy.nodeHtmlLabel([
  {
    query: 'node.path-node',
    halign: 'center',
    valign: 'center',
    cssClass: '',
    tpl: function (data) { return data.htmlLabel || ''; }
  },
  {
    query: 'node.detail',
    halign: 'center',
    valign: 'center',
    cssClass: '',
    tpl: function (data) { return data.htmlLabel || ''; }
  }
]);

// ── Level switching ──
function setLevel(l) {
  level = l;
  document.querySelectorAll('.lvl-btn').forEach(b =>
    b.classList.toggle('active', +b.dataset.level === l)
  );
  if (l === 1) { clr(exNodes); clr(exEdges); }
  if (l === 3) GRAPH.edges.forEach(e => { exEdges[e.id] = true; });
  shouldFit = true;
  nodePositions = {};
  basePositions = {};
  render();
}
function clr(o) { Object.keys(o).forEach(k => delete o[k]); }

// ── Build BFS tree for L2/L3 ──
function buildTree() {
  const t = {}, cross = [], vis = new Set(['cloudfront']);
  const q = ['cloudfront'];
  while (q.length) {
    const n = q.shift();
    GRAPH.edges.filter(e => e.from === n).forEach(e => {
      if (!vis.has(e.to)) {
        vis.add(e.to);
        (t[n] = t[n] || []).push(e.to);
        q.push(e.to);
      } else {
        cross.push(e);
      }
    });
  }
  return { t, cross };
}

// ── Render dispatcher ──
function render() {
  const savedZoom = cy.zoom();
  const savedPan = { ...cy.pan() };
  cy.elements().remove();
  if (level === 1) renderL1();
  else renderL2L3();
  if (shouldFit) {
    cy.fit(undefined, 40);
    shouldFit = false;
  } else {
    cy.viewport({ zoom: savedZoom, pan: savedPan });
  }
}

// ── L1: Application view ──
function renderL1() {
  const els = [];
  const cx = 500, cy_ = 300;

  els.push({ data: { id: 'center', label: 'IncidentHub Platform' },
    classes: 'current', position: { x: cx, y: cy_ }
  });

  // Left side: dependencies — services IncidentHub depends on
  // Derive status from corresponding L2 node
  const l2Map = {};
  GRAPH.nodes.forEach(n => { l2Map[n.id] = n; });

  const dN = GRAPH.downstream.length, dSp = 48;
  const dY0 = cy_ - ((dN - 1) * dSp) / 2;

  GRAPH.downstream.forEach((a, i) => {
    const l2node = a.l2id && l2Map[a.l2id];
    const st = l2node ? effectiveStatus(l2node) : (a.status || 'healthy');
    els.push({
      data: { id: a.id, label: a.name },
      classes: 'downstream' + statusNodeClass(st),
      position: { x: cx - 320, y: dY0 + i * dSp }
    });
    els.push({
      data: { id: 'ed-' + a.id, source: a.id, target: 'center', label: '' },
      classes: st === 'degraded' ? 'degraded' : st === 'warning' ? 'warning' : ''
    });
  });

  // Right side: consumers — services that require IncidentHub
  const uN = GRAPH.upstream.length, uSp = 48;
  const uY0 = cy_ - ((uN - 1) * uSp) / 2;

  GRAPH.upstream.forEach((a, i) => {
    const st = a.status || 'healthy';
    els.push({
      data: { id: a.id, label: a.name },
      classes: 'upstream' + statusNodeClass(st),
      position: { x: cx + 320, y: uY0 + i * uSp }
    });
    els.push({
      data: { id: 'eu-' + a.id, source: 'center', target: a.id, label: '' },
      classes: st === 'degraded' ? 'degraded' : st === 'warning' ? 'warning' : ''
    });
  });

  cy.add(els);
  cy.layout({ name: 'preset' }).run();
  cy.on('tap', 'node.current', () => setLevel(2));
}

// ── L2/L3: Component view ──
function renderL2L3() {
  const isAnimated = !shouldFit;

  // ── Phase 1: Build structural elements (main nodes, edges, path nodes) ──
  const structEls = [];
  const detailEls = [];

  // Main nodes
  GRAPH.nodes.forEach(n => {
    const cls = { external: 'external', database: 'database', infra: 'infra' }[n.type] || 'service';
    const hasDet = !!GRAPH.details[n.id];
    const expandCls = hasDet ? ' expandable' : '';
    const lbl = hasDet ? n.name + (exNodes[n.id] ? ' \u25BC' : ' \u25B6') : n.name;
    structEls.push({
      data: { id: n.id, label: lbl, hasDetail: hasDet },
      classes: cls + statusNodeClass(effectiveStatus(n)) + expandCls
    });
  });

  // Edges (including path expansions)
  GRAPH.edges.forEach(edge => {
    const hasDeg = edge.path.some(x => x.status === 'degraded');
    const hasWarn = edge.path.some(x => x.status === 'warning');
    const edgeStatusCls = hasDeg ? 'degraded' : hasWarn ? 'warning' : '';

    if (exEdges[edge.id]) {
      const pathIds = edge.path.map((inf, i) => 'i-' + edge.id + '-' + i);

      edge.path.forEach((inf, i) => {
        const pid = pathIds[i];
        const pathCls = 'path-node' + statusNodeClass(inf.status);
        const hasMetrics = inf.metrics && (inf.metrics.cpu || inf.metrics.ram || inf.metrics.net || inf.metrics.stor);
        const sizeCls = hasMetrics ? '' : ' path-node-short';
        structEls.push({
          data: { id: pid, label: '', htmlLabel: infraLabelHtml(inf), edgeId: edge.id,
                  pathEdgeFrom: edge.from, pathEdgeTo: edge.to, pathIndex: i, pathTotal: edge.path.length },
          classes: pathCls + sizeCls
        });
      });

      const chain = [edge.from, ...pathIds, edge.to];
      for (let j = 0; j < chain.length - 1; j++) {
        const segStatus = (j > 0 && j <= edge.path.length) ? edge.path[j - 1].status : '';
        const segCls = segStatus === 'degraded' ? ' degraded' : segStatus === 'warning' ? ' warning' : '';
        structEls.push({
          data: { id: 'seg-' + edge.id + '-' + j, source: chain[j], target: chain[j + 1], label: '', edgeId: edge.id },
          classes: 'thin infra-path' + segCls
        });
      }
    } else {
      const degCount = edge.path.filter(x => x.status === 'degraded').length;
      const warnCount = edge.path.filter(x => x.status === 'warning').length;
      let badgeLabel = '' + edge.path.length;
      if (degCount > 0) badgeLabel += ' (' + degCount + '\u2716)';
      else if (warnCount > 0) badgeLabel += ' (' + warnCount + '\u26A0)';
      structEls.push({
        data: { id: 'edge-' + edge.id, source: edge.from, target: edge.to, label: badgeLabel, edgeId: edge.id },
        classes: edgeStatusCls
      });
    }
  });

  // Detail elements — kept separate, positioned manually after dagre
  Object.keys(exNodes).forEach(nid => {
    if (!exNodes[nid] || !GRAPH.details[nid]) return;
    GRAPH.details[nid].forEach((d, i) => {
      const detCls = 'detail' + statusNodeClass(d.status);
      const hasMetrics = d.metrics && (d.metrics.cpu || d.metrics.ram);
      const metricsCls = hasMetrics ? ' detail-metrics' : '';
      detailEls.push({
        data: { id: d.id, label: '', htmlLabel: detailLabelHtml(d),
                parent_node: nid, detailIndex: i, detailTotal: GRAPH.details[nid].length },
        classes: detCls + metricsCls
      });
      detailEls.push({
        data: { id: 'det-' + nid + '-' + d.id, source: nid, target: d.id, label: '' },
        classes: 'thin'
      });
    });
  });

  // ── Phase 2: Position structural elements ──
  cy.add(structEls);
  const targetPos = {};
  const hasBase = Object.keys(basePositions).length > 0;

  if (!hasBase) {
    // First render for this level: run dagre to establish the base layout
    cy.layout({
      name: 'dagre',
      rankDir: 'LR',
      nodeSep: 80,
      rankSep: 160,
      edgeSep: 30,
      ranker: 'network-simplex',
      spacingFactor: 1.15,
      fit: false,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      animate: false
    }).run();
    // Lock these positions as the stable base
    cy.nodes().forEach(n => { basePositions[n.id()] = { ...n.position() }; });
    cy.nodes().forEach(n => { targetPos[n.id()] = { ...n.position() }; });
  } else {
    // Subsequent renders: start from locked base positions (no dagre re-run)
    Object.keys(basePositions).forEach(id => {
      targetPos[id] = { ...basePositions[id] };
    });

    // Insert path nodes for edges expanded AFTER the base layout
    const PATH_GAP = 180;
    const newPathEdges = GRAPH.edges.filter(e =>
      exEdges[e.id] && targetPos[e.from] && targetPos[e.to] &&
      !basePositions['i-' + e.id + '-0']  // not already in base layout
    );
    newPathEdges.sort((a, b) => targetPos[a.from].x - targetPos[b.from].x);

    newPathEdges.forEach(edge => {
      const fromX = targetPos[edge.from].x;
      const fromY = targetPos[edge.from].y;
      const toY = targetPos[edge.to].y;
      const totalPush = edge.path.length * PATH_GAP;

      // Push everything to the right of source to make room
      Object.keys(targetPos).forEach(id => {
        if (targetPos[id].x > fromX + 10) {
          targetPos[id].x += totalPush;
        }
      });

      // Place path nodes in the created space
      edge.path.forEach((inf, i) => {
        const pid = 'i-' + edge.id + '-' + i;
        const t = (i + 1) / (edge.path.length + 1);
        targetPos[pid] = {
          x: fromX + (i + 1) * PATH_GAP,
          y: fromY + (toY - fromY) * t
        };
      });
    });

    // Apply positions to cy nodes
    cy.nodes().forEach(n => {
      if (targetPos[n.id()]) n.position(targetPos[n.id()]);
    });
  }

  // ── Phase 3: Add detail nodes and compute all positions with push-right ──
  cy.add(detailEls);

  // Collect detail expansions, sorted left-to-right by parent X
  const detailExpansions = [];
  Object.keys(exNodes).forEach(nid => {
    if (!exNodes[nid] || !GRAPH.details[nid] || !targetPos[nid]) return;
    detailExpansions.push(nid);
  });
  detailExpansions.sort((a, b) => targetPos[a].x - targetPos[b].x);

  const DETAIL_GAP = 190;
  const DETAIL_SPACING = 40;

  detailExpansions.forEach(nid => {
    const pp = targetPos[nid];
    const details = GRAPH.details[nid];

    // Push all structural nodes to the right of this parent further right
    Object.keys(targetPos).forEach(id => {
      if (targetPos[id].x > pp.x + 10) {
        targetPos[id].x += DETAIL_GAP;
      }
    });

    // Position detail nodes in a column to the right of the parent
    const startY = pp.y - ((details.length - 1) * DETAIL_SPACING) / 2;
    details.forEach((d, i) => {
      targetPos[d.id] = {
        x: pp.x + DETAIL_GAP,
        y: startY + i * DETAIL_SPACING
      };
    });
  });

  // ── Phase 3b: Resolve overlaps ──
  // Build a list of all node bounding boxes and iteratively push apart
  const PAD = 12; // minimum gap between nodes
  function getNodeSize(id) {
    const n = cy.getElementById(id);
    if (n.length === 0) return { w: 160, h: 30 };
    return { w: n.width(), h: n.height() };
  }

  function resolveOverlaps() {
    const ids = Object.keys(targetPos);
    let moved = true;
    let iterations = 0;
    while (moved && iterations < 20) {
      moved = false;
      iterations++;
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i], b = ids[j];
          const pa = targetPos[a], pb = targetPos[b];
          const sa = getNodeSize(a), sb = getNodeSize(b);
          const overlapX = (sa.w / 2 + sb.w / 2 + PAD) - Math.abs(pa.x - pb.x);
          const overlapY = (sa.h / 2 + sb.h / 2 + PAD) - Math.abs(pa.y - pb.y);
          if (overlapX > 0 && overlapY > 0) {
            // Push apart on the axis with less overlap
            const pushY = overlapY / 2 + 1;
            if (pa.y <= pb.y) {
              pa.y -= pushY;
              pb.y += pushY;
            } else {
              pa.y += pushY;
              pb.y -= pushY;
            }
            moved = true;
          }
        }
      }
    }
  }

  resolveOverlaps();

  // ── Phase 4: Apply positions (instant or animated) ──
  if (isAnimated) {
    // Set nodes to their previous positions first (new nodes start at parent)
    cy.nodes().forEach(n => {
      const id = n.id();
      if (nodePositions[id]) {
        n.position(nodePositions[id]);
      } else {
        const origin = n.data('parent_node') || n.data('pathEdgeFrom');
        if (origin && nodePositions[origin]) {
          n.position({ ...nodePositions[origin] });
        } else if (targetPos[id]) {
          n.position(targetPos[id]);
        }
      }
    });

    // Animate each node to its target
    cy.nodes().forEach(n => {
      const target = targetPos[n.id()];
      if (target) {
        n.animate({ position: target }, { duration: 300, easing: 'ease-in-out-cubic' });
      }
    });
  } else {
    // Instant placement
    cy.nodes().forEach(n => {
      const target = targetPos[n.id()];
      if (target) n.position(target);
    });
  }

  // Save final positions
  nodePositions = { ...targetPos };

  // ── Event handling ──
  cy.off('tap');
  cy.on('tap', 'node', function (evt) {
    const node = evt.target;
    const id = node.id();
    const edgeId = node.data('edgeId');
    if (edgeId) { exEdges[edgeId] = !exEdges[edgeId]; render(); return; }
    if (GRAPH.details[id]) { exNodes[id] = !exNodes[id]; render(); }
  });
  cy.on('tap', 'edge', function (evt) {
    const edgeId = evt.target.data('edgeId');
    if (edgeId) { exEdges[edgeId] = !exEdges[edgeId]; render(); }
  });
}

// ── Initial render ──
render();
