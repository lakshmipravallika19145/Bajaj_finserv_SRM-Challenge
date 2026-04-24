const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ── Identity (fill in your real details) ──────────────────────────────────────
const USER_ID = "lakshmi_pravallika";        // e.g. "rajkumar_01012004"
const EMAIL_ID = "lakshmipravallika_kattamuri@srmap.edu.in";       // your college email
const ROLL_NUMBER = "AP23110011625";       // your roll number
// ─────────────────────────────────────────────────────────────────────────────

const VALID_EDGE = /^[A-Z]->[A-Z]$/;

function parseInput(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const seenEdges = new Set();
  const validEdges = [];

  for (let raw of data) {
    const entry = typeof raw === "string" ? raw.trim() : String(raw).trim();

    // Self-loop check
    if (entry.length === 4 && entry[0] === entry[3] && entry.slice(1, 3) === "->") {
      invalid_entries.push(raw);
      continue;
    }

    if (!VALID_EDGE.test(entry)) {
      invalid_entries.push(raw);
      continue;
    }

    // Valid edge
    if (seenEdges.has(entry)) {
      // Only push once to duplicate_edges
      if (!duplicate_edges.includes(entry)) {
        duplicate_edges.push(entry);
      }
    } else {
      seenEdges.add(entry);
      validEdges.push(entry);
    }
  }

  return { validEdges, invalid_entries, duplicate_edges };
}

function buildGraph(validEdges) {
  // child -> first parent (for diamond resolution)
  const firstParent = new Map();
  // adjacency list: parent -> [children]
  const adj = new Map();
  const allNodes = new Set();

  for (const edge of validEdges) {
    const [parent, child] = edge.split("->");

    allNodes.add(parent);
    allNodes.add(child);

    if (!firstParent.has(child)) {
      firstParent.set(child, parent);
      if (!adj.has(parent)) adj.set(parent, []);
      adj.get(parent).push(child);
    }
    // else: diamond — subsequent parent edge silently discarded
  }

  return { adj, firstParent, allNodes };
}

function findGroups(adj, firstParent, allNodes) {
  // Nodes that are never a child = potential roots
  const childNodes = new Set(firstParent.keys());
  const roots = [];
  for (const node of allNodes) {
    if (!childNodes.has(node)) roots.push(node);
  }

  // BFS/DFS from each root to find its group
  const visited = new Set();
  const groups = [];

  for (const root of roots.sort()) {
    if (visited.has(root)) continue;
    const group = new Set();
    const stack = [root];
    while (stack.length) {
      const n = stack.pop();
      if (group.has(n)) continue;
      group.add(n);
      visited.add(n);
      for (const child of (adj.get(n) || [])) {
        stack.push(child);
      }
    }
    groups.push({ root, nodes: group });
  }

  // Handle pure cycles (nodes never found via a root)
  const unvisited = [...allNodes].filter(n => !visited.has(n));
  if (unvisited.length) {
    // Group connected components among unvisited
    const uvAdj = new Map();
    for (const n of unvisited) {
      uvAdj.set(n, (adj.get(n) || []).filter(c => unvisited.includes(c)));
    }
    const uvVisited = new Set();
    for (const start of unvisited.sort()) {
      if (uvVisited.has(start)) continue;
      const group = new Set();
      const stack = [start];
      while (stack.length) {
        const n = stack.pop();
        if (group.has(n)) continue;
        group.add(n);
        uvVisited.add(n);
        for (const c of (uvAdj.get(n) || [])) stack.push(c);
      }
      // Lexicographically smallest as root
      const cycleRoot = [...group].sort()[0];
      groups.push({ root: cycleRoot, nodes: group, isCyclePure: true });
    }
  }

  return groups;
}

function hasCycle(root, adj) {
  const visited = new Set();
  const stack = new Set();
  function dfs(node) {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    for (const child of (adj.get(node) || [])) {
      if (dfs(child)) return true;
    }
    stack.delete(node);
    return false;
  }
  return dfs(root);
}

function buildTree(root, adj) {
  const tree = {};
  function dfs(node, obj) {
    obj[node] = {};
    for (const child of (adj.get(node) || [])) {
      dfs(child, obj[node]);
    }
  }
  dfs(root, tree);
  return tree;
}

function treeDepth(root, adj) {
  function dfs(node) {
    const children = adj.get(node) || [];
    if (!children.length) return 1;
    return 1 + Math.max(...children.map(dfs));
  }
  return dfs(root);
}

app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "data must be an array" });
    }

    const { validEdges, invalid_entries, duplicate_edges } = parseInput(data);
    const { adj, firstParent, allNodes } = buildGraph(validEdges);
    const groups = findGroups(adj, firstParent, allNodes);

    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let largest_tree_root = null;
    let largest_depth = -1;

    for (const { root, isCyclePure } of groups) {
      const cyclic = isCyclePure || hasCycle(root, adj);
      if (cyclic) {
        total_cycles++;
        hierarchies.push({ root, tree: {}, has_cycle: true });
      } else {
        total_trees++;
        const tree = buildTree(root, adj);
        const depth = treeDepth(root, adj);
        hierarchies.push({ root, tree, depth });
        if (
          depth > largest_depth ||
          (depth === largest_depth && root < largest_tree_root)
        ) {
          largest_depth = depth;
          largest_tree_root = root;
        }
      }
    }

    return res.json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: ROLL_NUMBER,
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => res.json({ status: "SRM BFHL API is live" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));