import { Film, Folder, ImageIcon, MessageCircle } from "lucide-react";
import type { WorkspaceTab } from "./types";

export const TABS: { id: WorkspaceTab; label: string; icon: typeof MessageCircle }[] = [
  { id: "chat", label: "咨询", icon: MessageCircle },
  { id: "image", label: "图片", icon: ImageIcon },
  { id: "video", label: "视频", icon: Film },
  { id: "assets", label: "素材库", icon: Folder },
];
