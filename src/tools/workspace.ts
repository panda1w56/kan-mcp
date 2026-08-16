import { KanClient } from '../client.js';
import { Workspace, WorkspaceListItem, ToolResult, ROUTES } from '../types.js';
import { success, error, assertString, assertOptionalString } from '../utils.js';
import { toMcpError } from '../errors.js';

export interface Tool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
  handler: (client: KanClient, input: TInput) => Promise<ToolResult<TOutput>>;
}

interface WorkspaceListInput {
  // GET /workspaces accepts no parameters
}

interface WorkspaceCreateInput {
  name: string;
  slug?: string;
  description?: string;
}

interface WorkspaceGetByIdInput {
  publicId: string;
}

interface WorkspaceGetBySlugInput {
  slug: string;
}

interface WorkspaceUpdateInput {
  publicId: string;
  name?: string;
  slug?: string;
  description?: string;
  showEmailsToMembers?: boolean;
  weekStartDay?: 0 | 1 | 6;
}

interface WorkspaceDeleteInput {
  publicId: string;
}

interface WorkspaceFindByNameInput {
  name: string;
}

interface WorkspaceSearchInput {
  workspacePublicId: string;
  query: string;
  limit?: number;
}

interface WorkspaceCheckSlugInput {
  slug: string;
}

interface SearchBoardItem {
  type: 'board';
  publicId: string;
  title: string;
  description: string | null;
  slug: string;
}

interface SearchCardItem {
  type: 'card';
  publicId: string;
  title: string;
  description: string | null;
  boardPublicId: string;
  boardName: string;
  listName: string;
  cardNumber: number | null;
}

type SearchItem = SearchBoardItem | SearchCardItem;

interface SearchResult {
  boards: SearchBoardItem[];
  cards: SearchCardItem[];
}

export const workspaceListTool: Tool<WorkspaceListInput, Workspace[]> = {
  name: 'workspace.list',
  description: 'Get all workspaces',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (client: KanClient, _input: WorkspaceListInput): Promise<ToolResult<Workspace[]>> => {
    try {
      const data = await client.request<WorkspaceListItem[]>(ROUTES.WORKSPACES);
      return success(data.map((item) => item.workspace));
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const workspaceCreateTool: Tool<WorkspaceCreateInput, Workspace> = {
  name: 'workspace.create',
  description: 'Create a new workspace. The slug is optional and auto-generated from the name when omitted.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string' },
    },
    required: ['name'],
  },
  handler: async (client: KanClient, input: WorkspaceCreateInput): Promise<ToolResult<Workspace>> => {
    try {
      assertString(input.name, 'name');
      assertOptionalString(input.slug, 'slug');
      assertOptionalString(input.description, 'description');
      const body: Record<string, unknown> = { name: input.name };
      if (input.slug !== undefined) body.slug = input.slug;
      if (input.description !== undefined) body.description = input.description;
      const data = await client.request<Workspace>(ROUTES.WORKSPACES, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const workspaceGetByIdTool: Tool<WorkspaceGetByIdInput, Workspace> = {
  name: 'workspace.getById',
  description: 'Get workspace by public ID',
  inputSchema: {
    type: 'object',
    properties: {
      publicId: { type: 'string' },
    },
    required: ['publicId'],
  },
  handler: async (client: KanClient, input: WorkspaceGetByIdInput): Promise<ToolResult<Workspace>> => {
    try {
      assertString(input.publicId, 'publicId');
      const data = await client.request<Workspace>(`${ROUTES.WORKSPACES}/${input.publicId}`);
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const workspaceGetBySlugTool: Tool<WorkspaceGetBySlugInput, Workspace> = {
  name: 'workspace.getBySlug',
  description: 'Get workspace by slug',
  inputSchema: {
    type: 'object',
    properties: {
      slug: { type: 'string' },
    },
    required: ['slug'],
  },
  handler: async (client: KanClient, input: WorkspaceGetBySlugInput): Promise<ToolResult<Workspace>> => {
    try {
      assertString(input.slug, 'slug');
      const data = await client.request<Workspace>(`${ROUTES.WORKSPACES}/${input.slug}`);
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const workspaceFindByNameTool: Tool<WorkspaceFindByNameInput, Workspace> = {
  name: 'workspace.findByName',
  description: 'Find a workspace by its name (case-insensitive)',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    required: ['name'],
  },
  handler: async (client: KanClient, input: WorkspaceFindByNameInput): Promise<ToolResult<Workspace>> => {
    try {
      assertString(input.name, 'name');
      const items = await client.request<WorkspaceListItem[]>(ROUTES.WORKSPACES);
      const match = items.find((item) => item.workspace.name.toLowerCase() === input.name.toLowerCase());
      if (!match) {
        return error(`No workspace found with name "${input.name}"`);
      }
      return success(match.workspace);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const workspaceUpdateTool: Tool<WorkspaceUpdateInput, Workspace> = {
  name: 'workspace.update',
  description: 'Update a workspace. weekStartDay must be 0 (Sunday), 1 (Monday), or 6 (Saturday).',
  inputSchema: {
    type: 'object',
    properties: {
      publicId: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string' },
      showEmailsToMembers: { type: 'boolean' },
      weekStartDay: { type: 'number', enum: [0, 1, 6] },
    },
    required: ['publicId'],
  },
  handler: async (client: KanClient, input: WorkspaceUpdateInput): Promise<ToolResult<Workspace>> => {
    try {
      assertString(input.publicId, 'publicId');
      assertOptionalString(input.name, 'name');
      assertOptionalString(input.slug, 'slug');
      assertOptionalString(input.description, 'description');
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.slug !== undefined) body.slug = input.slug;
      if (input.description !== undefined) body.description = input.description;
      if (input.showEmailsToMembers !== undefined) body.showEmailsToMembers = input.showEmailsToMembers;
      if (input.weekStartDay !== undefined) body.weekStartDay = input.weekStartDay;
      const data = await client.request<Workspace>(`${ROUTES.WORKSPACES}/${input.publicId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const workspaceDeleteTool: Tool<WorkspaceDeleteInput, { success: boolean }> = {
  name: 'workspace.delete',
  description: 'Delete a workspace',
  inputSchema: {
    type: 'object',
    properties: {
      publicId: { type: 'string' },
    },
    required: ['publicId'],
  },
  handler: async (client: KanClient, input: WorkspaceDeleteInput): Promise<ToolResult<{ success: boolean }>> => {
    try {
      assertString(input.publicId, 'publicId');
      await client.request(`${ROUTES.WORKSPACES}/${input.publicId}`, {
        method: 'DELETE',
      });
      return success({ success: true });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const workspaceSearchTool: Tool<WorkspaceSearchInput, SearchResult> = {
  name: 'workspace.search',
  description: 'Search boards and cards within a workspace',
  inputSchema: {
    type: 'object',
    properties: {
      workspacePublicId: { type: 'string' },
      query: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 50 },
    },
    required: ['workspacePublicId', 'query'],
  },
  handler: async (client: KanClient, input: WorkspaceSearchInput): Promise<ToolResult<SearchResult>> => {
    try {
      assertString(input.workspacePublicId, 'workspacePublicId');
      assertString(input.query, 'query');
      const queryParams = new URLSearchParams({ query: input.query });
      if (input.limit !== undefined) queryParams.set('limit', String(input.limit));
      const items = await client.request<SearchItem[]>(
        `${ROUTES.WORKSPACES}/${input.workspacePublicId}/search?${queryParams}`
      );
      const boards = items.filter((item): item is SearchBoardItem => item.type === 'board');
      const cards = items.filter((item): item is SearchCardItem => item.type === 'card');
      return success({ boards, cards });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const workspaceCheckSlugAvailabilityTool: Tool<WorkspaceCheckSlugInput, { available: boolean }> = {
  name: 'workspace.checkSlugAvailability',
  description: 'Check if a workspace slug is available',
  inputSchema: {
    type: 'object',
    properties: {
      slug: { type: 'string' },
    },
    required: ['slug'],
  },
  handler: async (
    client: KanClient,
    input: WorkspaceCheckSlugInput
  ): Promise<ToolResult<{ available: boolean }>> => {
    try {
      assertString(input.slug, 'slug');
      const queryParams = new URLSearchParams({ workspaceSlug: input.slug });
      const data = await client.request<{ isAvailable: boolean; isReserved: boolean }>(
        `${ROUTES.WORKSPACES}/check-slug-availability?${queryParams}`
      );
      return success({ available: data.isAvailable && !data.isReserved });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};
