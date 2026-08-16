import type { Tool } from './workspace.js';
import {
  workspaceListTool,
  workspaceCreateTool,
  workspaceGetByIdTool,
  workspaceGetBySlugTool,
  workspaceFindByNameTool,
  workspaceUpdateTool,
  workspaceDeleteTool,
  workspaceSearchTool,
  workspaceCheckSlugAvailabilityTool,
} from './workspace.js';
import {
  boardListTool,
  boardCreateTool,
  boardFindByNameTool,
  boardGetByIdTool,
  boardGetBySlugTool,
  boardUpdateTool,
  boardDeleteTool,
  boardCheckSlugAvailabilityTool,
} from './board.js';
import {
  listCreateTool,
  listUpdateTool,
  listDeleteTool,
} from './list.js';
import {
  cardCreateTool,
  cardGetByIdTool,
  cardUpdateTool,
  cardDeleteTool,
  cardDuplicateTool,
  cardAddLabelTool,
  cardRemoveLabelTool,
  cardAddMemberTool,
  cardRemoveMemberTool,
  cardListActivitiesTool,
} from './card.js';
import {
  labelCreateTool,
  labelGetByIdTool,
  labelUpdateTool,
  labelDeleteTool,
} from './label.js';
import {
  checklistCreateTool,
  checklistUpdateTool,
  checklistDeleteTool,
  checklistAddItemTool,
  checklistUpdateItemTool,
  checklistDeleteItemTool,
} from './checklist.js';
import {
  commentAddTool,
  commentUpdateTool,
  commentDeleteTool,
} from './comment.js';
import { serverHealthTool } from './server.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tools: any[] = [
  workspaceListTool,
  workspaceCreateTool,
  workspaceGetByIdTool,
  workspaceGetBySlugTool,
  workspaceFindByNameTool,
  workspaceUpdateTool,
  workspaceDeleteTool,
  workspaceSearchTool,
  workspaceCheckSlugAvailabilityTool,
  boardListTool,
  boardCreateTool,
  boardFindByNameTool,
  boardGetByIdTool,
  boardGetBySlugTool,
  boardUpdateTool,
  boardDeleteTool,
  boardCheckSlugAvailabilityTool,
  listCreateTool,
  listUpdateTool,
  listDeleteTool,
  cardCreateTool,
  cardGetByIdTool,
  cardUpdateTool,
  cardDeleteTool,
  cardDuplicateTool,
  cardAddLabelTool,
  cardRemoveLabelTool,
  cardAddMemberTool,
  cardRemoveMemberTool,
  cardListActivitiesTool,
  labelCreateTool,
  labelGetByIdTool,
  labelUpdateTool,
  labelDeleteTool,
  checklistCreateTool,
  checklistUpdateTool,
  checklistDeleteTool,
  checklistAddItemTool,
  checklistUpdateItemTool,
  checklistDeleteItemTool,
  commentAddTool,
  commentUpdateTool,
  commentDeleteTool,
  serverHealthTool,
];

export type { Tool } from './workspace.js';
