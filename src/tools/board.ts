import { KanClient } from '../client.js';
import { Board, Visibility, ToolResult, ROUTES, WorkspaceListItem } from '../types.js';
import { success, error, assertString, assertOptionalString } from '../utils.js';
import { toMcpError } from '../errors.js';

interface Tool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
  handler: (client: KanClient, input: TInput) => Promise<ToolResult<TOutput>>;
}

interface BoardListInput {
  workspacePublicId: string;
  type?: 'regular' | 'template';
  archived?: boolean;
}

interface BoardCreateInput {
  workspacePublicId: string;
  name: string;
  lists?: string[];
  labels?: string[];
  type?: 'regular' | 'template';
  sourceBoardPublicId?: string;
}

interface BoardCreateOutput {
  publicId: string;
  name: string;
}

interface BoardGetByIdInput {
  publicId: string;
  members?: string[];
  labels?: string[];
  lists?: string[];
  dueDateFilters?: DueDateFilter[];
  type?: 'regular' | 'template';
}

interface BoardGetBySlugInput {
  workspaceSlug: string;
  boardSlug: string;
  members?: string[];
  labels?: string[];
  lists?: string[];
  dueDateFilters?: DueDateFilter[];
}

interface BoardUpdateInput {
  publicId: string;
  name?: string;
  slug?: string;
  visibility?: Visibility;
  favorite?: boolean;
  isArchived?: boolean;
}

interface BoardDeleteInput {
  publicId: string;
}

interface BoardFindByNameInput {
  workspaceName: string;
  boardName: string;
}

interface BoardCheckSlugInput {
  boardPublicId: string;
  boardSlug: string;
}

export const DUE_DATE_FILTERS = ['overdue', 'today', 'tomorrow', 'next-week', 'next-month', 'no-due-date'] as const;
export type DueDateFilter = (typeof DUE_DATE_FILTERS)[number];

function assertStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array of strings`);
  }
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0) {
      throw new Error(`${fieldName} must contain only non-empty strings`);
    }
  }
  return value as string[];
}

export const boardListTool: Tool<BoardListInput, Board[]> = {
  name: 'board.list',
  description: 'Get all boards in a workspace',
  inputSchema: {
    type: 'object',
    properties: {
      workspacePublicId: { type: 'string' },
      type: { type: 'string', enum: ['regular', 'template'] },
      archived: { type: 'boolean' },
    },
    required: ['workspacePublicId'],
  },
  handler: async (client: KanClient, input: BoardListInput): Promise<ToolResult<Board[]>> => {
    try {
      assertString(input.workspacePublicId, 'workspacePublicId');
      const queryParams = new URLSearchParams();
      if (input.type) queryParams.set('type', input.type);
      if (input.archived !== undefined) queryParams.set('archived', String(input.archived));
      const query = queryParams.toString();
      const path = `${ROUTES.WORKSPACES}/${input.workspacePublicId}${ROUTES.BOARDS}${query ? `?${query}` : ''}`;
      const data = await client.request<Board[]>(path);
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const boardFindByNameTool: Tool<BoardFindByNameInput, Board> = {
  name: 'board.findByName',
  description: 'Find a board by workspace name and board name (both case-insensitive)',
  inputSchema: {
    type: 'object',
    properties: {
      workspaceName: { type: 'string' },
      boardName: { type: 'string' },
    },
    required: ['workspaceName', 'boardName'],
  },
  handler: async (client: KanClient, input: BoardFindByNameInput): Promise<ToolResult<Board>> => {
    try {
      assertString(input.workspaceName, 'workspaceName');
      assertString(input.boardName, 'boardName');
      const items = await client.request<WorkspaceListItem[]>(ROUTES.WORKSPACES);
      const workspace = items.find(
        (item) => item.workspace.name.toLowerCase() === input.workspaceName.toLowerCase()
      )?.workspace;
      if (!workspace) {
        return error(`No workspace found with name "${input.workspaceName}"`);
      }
      const boards = await client.request<Board[]>(
        `${ROUTES.WORKSPACES}/${workspace.publicId}${ROUTES.BOARDS}`
      );
      const board = boards.find((b) => b.name.toLowerCase() === input.boardName.toLowerCase());
      if (!board) {
        return error(`No board found with name "${input.boardName}" in workspace "${input.workspaceName}"`);
      }
      return success(board);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const boardCreateTool: Tool<BoardCreateInput, BoardCreateOutput> = {
  name: 'board.create',
  description:
    'Create a new board in a workspace. The slug is auto-generated from the name. ' +
    'Optionally provide initial list names and label names, or sourceBoardPublicId to clone an existing board.',
  inputSchema: {
    type: 'object',
    properties: {
      workspacePublicId: { type: 'string' },
      name: { type: 'string' },
      lists: { type: 'array', items: { type: 'string' } },
      labels: { type: 'array', items: { type: 'string' } },
      type: { type: 'string', enum: ['regular', 'template'] },
      sourceBoardPublicId: { type: 'string' },
    },
    required: ['workspacePublicId', 'name'],
  },
  handler: async (client: KanClient, input: BoardCreateInput): Promise<ToolResult<BoardCreateOutput>> => {
    try {
      assertString(input.workspacePublicId, 'workspacePublicId');
      assertString(input.name, 'name');
      const lists = input.lists === undefined ? [] : assertStringArray(input.lists, 'lists');
      const labels = input.labels === undefined ? [] : assertStringArray(input.labels, 'labels');
      assertOptionalString(input.sourceBoardPublicId, 'sourceBoardPublicId');
      const body: Record<string, unknown> = { name: input.name, lists, labels };
      if (input.type !== undefined) body.type = input.type;
      if (input.sourceBoardPublicId !== undefined) body.sourceBoardPublicId = input.sourceBoardPublicId;
      const data = await client.request<BoardCreateOutput>(
        `${ROUTES.WORKSPACES}/${input.workspacePublicId}${ROUTES.BOARDS}`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const boardGetByIdTool: Tool<BoardGetByIdInput, Board> = {
  name: 'board.getById',
  description: 'Get board by public ID',
  inputSchema: {
    type: 'object',
    properties: {
      publicId: { type: 'string' },
      members: { type: 'array', items: { type: 'string' } },
      labels: { type: 'array', items: { type: 'string' } },
      lists: { type: 'array', items: { type: 'string' } },
      dueDateFilters: { type: 'array', items: { type: 'string', enum: ['overdue', 'today', 'tomorrow', 'next-week', 'next-month', 'no-due-date'] } },
      type: { type: 'string', enum: ['regular', 'template'] },
    },
    required: ['publicId'],
  },
  handler: async (client: KanClient, input: BoardGetByIdInput): Promise<ToolResult<Board>> => {
    try {
      assertString(input.publicId, 'publicId');
      const queryParams = new URLSearchParams();
      if (input.members?.length) queryParams.set('members', input.members.join(','));
      if (input.labels?.length) queryParams.set('labels', input.labels.join(','));
      if (input.lists?.length) queryParams.set('lists', input.lists.join(','));
      if (input.dueDateFilters?.length) queryParams.set('dueDateFilters', input.dueDateFilters.join(','));
      if (input.type) queryParams.set('type', input.type);
      const query = queryParams.toString();
      const path = `${ROUTES.BOARDS}/${input.publicId}${query ? `?${query}` : ''}`;
      const data = await client.request<Board>(path);
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const boardGetBySlugTool: Tool<BoardGetBySlugInput, Board> = {
  name: 'board.getBySlug',
  description: 'Get board by workspace slug and board slug',
  inputSchema: {
    type: 'object',
    properties: {
      workspaceSlug: { type: 'string' },
      boardSlug: { type: 'string' },
      members: { type: 'array', items: { type: 'string' } },
      labels: { type: 'array', items: { type: 'string' } },
      lists: { type: 'array', items: { type: 'string' } },
      dueDateFilters: { type: 'array', items: { type: 'string', enum: ['overdue', 'today', 'tomorrow', 'next-week', 'next-month', 'no-due-date'] } },
    },
    required: ['workspaceSlug', 'boardSlug'],
  },
  handler: async (client: KanClient, input: BoardGetBySlugInput): Promise<ToolResult<Board>> => {
    try {
      assertString(input.workspaceSlug, 'workspaceSlug');
      assertString(input.boardSlug, 'boardSlug');
      const queryParams = new URLSearchParams();
      if (input.members?.length) queryParams.set('members', input.members.join(','));
      if (input.labels?.length) queryParams.set('labels', input.labels.join(','));
      if (input.lists?.length) queryParams.set('lists', input.lists.join(','));
      if (input.dueDateFilters?.length) queryParams.set('dueDateFilters', input.dueDateFilters.join(','));
      const query = queryParams.toString();
      const path = `${ROUTES.WORKSPACES}/${input.workspaceSlug}${ROUTES.BOARDS}/${input.boardSlug}${query ? `?${query}` : ''}`;
      const data = await client.request<Board>(path);
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const boardUpdateTool: Tool<BoardUpdateInput, Board> = {
  name: 'board.update',
  description: 'Update a board (name, slug, visibility, favorite, or archived state)',
  inputSchema: {
    type: 'object',
    properties: {
      publicId: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      visibility: { type: 'string', enum: ['public', 'private'] },
      favorite: { type: 'boolean' },
      isArchived: { type: 'boolean' },
    },
    required: ['publicId'],
  },
  handler: async (client: KanClient, input: BoardUpdateInput): Promise<ToolResult<Board>> => {
    try {
      assertString(input.publicId, 'publicId');
      assertOptionalString(input.name, 'name');
      assertOptionalString(input.slug, 'slug');
      assertOptionalString(input.visibility, 'visibility');
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.slug !== undefined) body.slug = input.slug;
      if (input.visibility !== undefined) body.visibility = input.visibility;
      if (input.favorite !== undefined) body.favorite = input.favorite;
      if (input.isArchived !== undefined) body.isArchived = input.isArchived;
      const data = await client.request<Board>(`${ROUTES.BOARDS}/${input.publicId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const boardDeleteTool: Tool<BoardDeleteInput, { success: boolean }> = {
  name: 'board.delete',
  description: 'Delete a board',
  inputSchema: {
    type: 'object',
    properties: {
      publicId: { type: 'string' },
    },
    required: ['publicId'],
  },
  handler: async (client: KanClient, input: BoardDeleteInput): Promise<ToolResult<{ success: boolean }>> => {
    try {
      assertString(input.publicId, 'publicId');
      await client.request(`${ROUTES.BOARDS}/${input.publicId}`, {
        method: 'DELETE',
      });
      return success({ success: true });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const boardCheckSlugAvailabilityTool: Tool<BoardCheckSlugInput, { available: boolean }> = {
  name: 'board.checkSlugAvailability',
  description:
    'Check if a board slug is available within the workspace that contains the given board. ' +
    'Requires the publicId of an existing board in the target workspace (used to resolve the workspace) and the slug to check.',
  inputSchema: {
    type: 'object',
    properties: {
      boardPublicId: { type: 'string' },
      boardSlug: { type: 'string' },
    },
    required: ['boardPublicId', 'boardSlug'],
  },
  handler: async (
    client: KanClient,
    input: BoardCheckSlugInput
  ): Promise<ToolResult<{ available: boolean }>> => {
    try {
      assertString(input.boardPublicId, 'boardPublicId');
      assertString(input.boardSlug, 'boardSlug');
      const queryParams = new URLSearchParams({ boardSlug: input.boardSlug });
      const data = await client.request<{ isReserved: boolean }>(
        `${ROUTES.BOARDS}/${input.boardPublicId}/check-slug-availability?${queryParams}`
      );
      return success({ available: !data.isReserved });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};
