import { useMemo } from "react";
import { GitBranch } from "lucide-react";
import type { ChatMessage } from "../types";

interface BranchVisualizationProps {
  messages: ChatMessage[];
  activeLeafId: string | null;
  onSelectMessage: (id: string) => void;
}

interface TreeNode {
  id: string;
  role: "user" | "assistant";
  content: string;
  children: TreeNode[];
  isActive: boolean;
  depth: number;
}

function buildTree(
  messages: ChatMessage[],
  activeLeafId: string | null
): TreeNode[] {
  const byId = new Map(messages.map((m) => [m.id, m]));
  const childrenMap = new Map<string | null, ChatMessage[]>();

  for (const msg of messages) {
    const parentId = msg.parentId || null;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(msg);
  }

  const activePath = new Set<string>();
  let currentId = activeLeafId;
  while (currentId) {
    activePath.add(currentId);
    const msg = byId.get(currentId);
    currentId = msg?.parentId || null;
  }

  function buildNode(id: string, depth: number): TreeNode {
    const msg = byId.get(id)!;
    const children = childrenMap.get(id) || [];
    return {
      id,
      role: msg.role,
      content: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""),
      children: children.map((c) => buildNode(c.id, depth + 1)),
      isActive: activePath.has(id),
      depth,
    };
  }

  const roots = childrenMap.get(null) || [];
  return roots.map((r) => buildNode(r.id, 0));
}

function TreeNodeComponent({
  node,
  onSelect,
}: {
  node: TreeNode;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={`branch-node${node.isActive ? " active" : ""}`}>
      <button
        type="button"
        className="branch-node-button"
        onClick={() => onSelect(node.id)}
        style={{ marginLeft: node.depth * 20 }}
        title={node.content}
      >
        <span className="branch-node-role">{node.role === "user" ? "👤" : "🤖"}</span>
        <span className="branch-node-content">{node.content}</span>
      </button>
      {node.children.length > 1 && (
        <div className="branch-indicator">
          <GitBranch size={12} />
          <span>{node.children.length} 个分支</span>
        </div>
      )}
      {node.children.map((child) => (
        <TreeNodeComponent key={child.id} node={child} onSelect={onSelect} />
      ))}
    </div>
  );
}

export function BranchVisualization({
  messages,
  activeLeafId,
  onSelectMessage,
}: BranchVisualizationProps) {
  const tree = useMemo(
    () => buildTree(messages, activeLeafId),
    [messages, activeLeafId]
  );

  if (tree.length === 0) {
    return (
      <div className="branch-empty">
        <GitBranch size={24} />
        <span>暂无分支结构</span>
      </div>
    );
  }

  return (
    <div className="branch-visualization" role="tree" aria-label="会话分支结构">
      {tree.map((node) => (
        <TreeNodeComponent key={node.id} node={node} onSelect={onSelectMessage} />
      ))}
    </div>
  );
}
