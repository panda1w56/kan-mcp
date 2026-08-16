import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { KanClient } from '../../src/client';
import { Workspace, WorkspaceListItem } from '../../src/types';
import {
  workspaceListTool,
  workspaceCreateTool,
  workspaceGetByIdTool,
  workspaceGetBySlugTool,
  workspaceUpdateTool,
  workspaceDeleteTool,
  workspaceSearchTool,
  workspaceFindByNameTool,
  workspaceCheckSlugAvailabilityTool,
} from '../../src/tools/workspace';

const TEST_API_KEY = 'test-api-key';
let originalFetch: typeof fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const mockWorkspace: Workspace = {
  publicId: 'ws-1',
  name: 'Workspace 1',
  slug: 'workspace-1',
  description: 'Test workspace',
  showEmailsToMembers: false,
  weekStartDay: 1,
};

function wrap(workspaces: Workspace[]): WorkspaceListItem[] {
  return workspaces.map((workspace) => ({ role: 'admin', workspace }));
}

describe('workspace tools', () => {
  describe('workspace.list', () => {
    test('returns list of workspaces unwrapped from role items', async () => {
      const client = new KanClient(TEST_API_KEY);

      globalThis.fetch = async () =>
        new Response(JSON.stringify(wrap([mockWorkspace])), {
          status: 200,
          ok: true,
        }) as Response;

      const result = await workspaceListTool.handler(client, {});

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([mockWorkspace]);
      }
    });

    test('returns error on API failure', async () => {
      const client = new KanClient(TEST_API_KEY, undefined, 5000, 0);

      globalThis.fetch = async () =>
        new Response(null, {
          status: 500,
          statusText: 'Internal Server Error',
          ok: false,
        }) as Response;

      const result = await workspaceListTool.handler(client, {});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeTruthy();
      }
    });
  });

  describe('workspace.create', () => {
    test('creates a workspace with slug', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { name: 'New Workspace', slug: 'new-workspace' };

      let receivedUrl = '';
      let receivedMethod = '';
      let receivedBody = '';

      globalThis.fetch = async (url, init) => {
        receivedUrl = url as string;
        receivedMethod = init?.method ?? 'GET';
        receivedBody = init?.body as string;
        return new Response(JSON.stringify(mockWorkspace), {
          status: 201,
          ok: true,
        }) as Response;
      };

      const result = await workspaceCreateTool.handler(client, input);

      expect(receivedMethod).toBe('POST');
      expect(receivedUrl).toContain('/workspaces');
      expect(JSON.parse(receivedBody)).toEqual(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockWorkspace);
      }
    });

    test('creates a workspace without slug (auto-generated)', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { name: 'New Workspace' };

      let receivedBody = '';

      globalThis.fetch = async (url, init) => {
        receivedBody = init?.body as string;
        return new Response(JSON.stringify(mockWorkspace), {
          status: 201,
          ok: true,
        }) as Response;
      };

      const result = await workspaceCreateTool.handler(client, input);

      expect(JSON.parse(receivedBody)).toEqual({ name: 'New Workspace' });
      expect(result.ok).toBe(true);
    });

    test('returns error when name is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await workspaceCreateTool.handler(client, { slug: 'test' } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('name');
      }
    });
  });

  describe('workspace.getById', () => {
    test('returns workspace by public ID', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'ws-123' };

      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockWorkspace), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await workspaceGetByIdTool.handler(client, input);

      expect(receivedUrl).toContain('/workspaces/ws-123');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockWorkspace);
      }
    });

    test('returns error when publicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await workspaceGetByIdTool.handler(client, {} as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('publicId');
      }
    });
  });

  describe('workspace.getBySlug', () => {
    test('returns workspace by slug', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { slug: 'my-workspace' };

      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockWorkspace), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await workspaceGetBySlugTool.handler(client, input);

      expect(receivedUrl).toContain('/workspaces/my-workspace');
      expect(receivedUrl).not.toContain('/slug/');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockWorkspace);
      }
    });

    test('returns error when slug is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await workspaceGetBySlugTool.handler(client, {} as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('slug');
      }
    });
  });

  describe('workspace.update', () => {
    test('updates a workspace with PUT', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'ws-123', name: 'Updated Name' };
      const updated = { ...mockWorkspace, name: 'Updated Name' };

      let receivedUrl = '';
      let receivedMethod = '';

      globalThis.fetch = async (url, init) => {
        receivedUrl = url as string;
        receivedMethod = init?.method ?? 'GET';
        return new Response(JSON.stringify(updated), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await workspaceUpdateTool.handler(client, input);

      expect(receivedMethod).toBe('PUT');
      expect(receivedUrl).toContain('/workspaces/ws-123');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Updated Name');
      }
    });

    test('passes weekStartDay as number', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'ws-123', weekStartDay: 6 as const };

      let receivedBody = '';

      globalThis.fetch = async (url, init) => {
        receivedBody = init?.body as string;
        return new Response(JSON.stringify(mockWorkspace), { status: 200, ok: true }) as Response;
      };

      const result = await workspaceUpdateTool.handler(client, input);

      expect(JSON.parse(receivedBody)).toEqual({ weekStartDay: 6 });
      expect(result.ok).toBe(true);
    });

    test('returns error when publicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await workspaceUpdateTool.handler(client, { name: 'Test' } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('publicId');
      }
    });
  });

  describe('workspace.delete', () => {
    test('deletes a workspace', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'ws-123' };

      let receivedUrl = '';
      let receivedMethod = '';

      globalThis.fetch = async (url, init) => {
        receivedUrl = url as string;
        receivedMethod = init?.method ?? 'GET';
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await workspaceDeleteTool.handler(client, input);

      expect(receivedMethod).toBe('DELETE');
      expect(receivedUrl).toContain('/workspaces/ws-123');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ success: true });
      }
    });

    test('returns error when publicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await workspaceDeleteTool.handler(client, {} as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('publicId');
      }
    });
  });

  describe('workspace.search', () => {
    test('searches boards and cards within a workspace', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { workspacePublicId: 'ws-1', query: 'test' };
      const mockItems = [
        { type: 'board', publicId: 'board-1', title: 'Test Board', description: null, slug: 'test-board' },
        { type: 'card', publicId: 'card-1', title: 'Test Card', description: null, boardPublicId: 'board-1', boardName: 'Test Board', listName: 'To Do', cardNumber: 1 },
      ];

      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockItems), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await workspaceSearchTool.handler(client, input);

      expect(receivedUrl).toContain('/workspaces/ws-1/search');
      expect(receivedUrl).toContain('query=test');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.boards).toHaveLength(1);
        expect(result.data.cards).toHaveLength(1);
        expect(result.data.boards[0]?.publicId).toBe('board-1');
        expect(result.data.cards[0]?.publicId).toBe('card-1');
      }
    });

    test('passes limit to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { workspacePublicId: 'ws-1', query: 'test', limit: 5 };

      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify([]), { status: 200, ok: true }) as Response;
      };

      const result = await workspaceSearchTool.handler(client, input);

      expect(receivedUrl).toContain('limit=5');
      expect(result.ok).toBe(true);
    });

    test('returns error when workspacePublicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await workspaceSearchTool.handler(client, { query: 'test' } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('workspacePublicId');
      }
    });

    test('returns error when query is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await workspaceSearchTool.handler(client, { workspacePublicId: 'ws-1' } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('query');
      }
    });
  });

  describe('workspace.checkSlugAvailability', () => {
    test('returns available when slug is available and not reserved', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { slug: 'my-workspace' };
      const mockResponse = { isAvailable: true, isReserved: false };

      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await workspaceCheckSlugAvailabilityTool.handler(client, input);

      expect(receivedUrl).toContain('/workspaces/check-slug-availability');
      expect(receivedUrl).toContain('workspaceSlug=my-workspace');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.available).toBe(true);
      }
    });

    test('returns unavailable when slug is reserved', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { slug: 'reserved-workspace' };
      const mockResponse = { isAvailable: true, isReserved: true };

      globalThis.fetch = async () =>
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          ok: true,
        }) as Response;

      const result = await workspaceCheckSlugAvailabilityTool.handler(client, input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.available).toBe(false);
      }
    });

    test('returns error when slug is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await workspaceCheckSlugAvailabilityTool.handler(client, {} as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('slug');
      }
    });
  });

  describe('workspace.findByName', () => {
    test('finds workspace by name (case-insensitive)', async () => {
      const client = new KanClient(TEST_API_KEY);
      const target = { ...mockWorkspace, name: 'Project Alpha' };

      globalThis.fetch = async () =>
        new Response(JSON.stringify(wrap([target])), { status: 200, ok: true }) as Response;

      const result = await workspaceFindByNameTool.handler(client, { name: 'project alpha' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.publicId).toBe('ws-1');
      }
    });

    test('returns error when workspace not found', async () => {
      const client = new KanClient(TEST_API_KEY);
      globalThis.fetch = async () =>
        new Response(JSON.stringify([]), { status: 200, ok: true }) as Response;

      const result = await workspaceFindByNameTool.handler(client, { name: 'nonexistent' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('No workspace found');
      }
    });

    test('returns error on API failure', async () => {
      const client = new KanClient(TEST_API_KEY, undefined, 5000, 0);
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, ok: false }) as Response;

      const result = await workspaceFindByNameTool.handler(client, { name: 'test' });

      expect(result.ok).toBe(false);
    });
  });

});
