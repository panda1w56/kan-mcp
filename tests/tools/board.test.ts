import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { KanClient } from '../../src/client';
import { Board } from '../../src/types';
import {
  boardListTool,
  boardCreateTool,
  boardGetByIdTool,
  boardGetBySlugTool,
  boardUpdateTool,
  boardDeleteTool,
  boardFindByNameTool,
  boardCheckSlugAvailabilityTool,
} from '../../src/tools/board';

const TEST_API_KEY = 'test-api-key';
let originalFetch: typeof fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const mockBoard: Board = {
  publicId: 'board-1',
  workspacePublicId: 'ws-1',
  name: 'Test Board',
  slug: 'test-board',
  visibility: 'public',
  type: 'regular',
  isArchived: false,
  favorite: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('board tools', () => {
  describe('board.list', () => {
    test('returns list of boards for a workspace', async () => {
      const client = new KanClient(TEST_API_KEY);
      const mockBoards: Board[] = [mockBoard];
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockBoards), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await boardListTool.handler(client, { workspacePublicId: 'ws-1' });

      expect(receivedUrl).toContain('/workspaces/ws-1/boards');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockBoards);
      }
    });

    test('passes type filter to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify([]), { status: 200, ok: true }) as Response;
      };

      const result = await boardListTool.handler(client, { workspacePublicId: 'ws-1', type: 'template' });

      expect(receivedUrl).toContain('/workspaces/ws-1/boards');
      expect(receivedUrl).toContain('type=template');
      expect(result.ok).toBe(true);
    });

    test('passes archived filter to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify([]), { status: 200, ok: true }) as Response;
      };

      const result = await boardListTool.handler(client, { workspacePublicId: 'ws-1', archived: true });

      expect(receivedUrl).toContain('archived=true');
      expect(result.ok).toBe(true);
    });

    test('returns error when workspacePublicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardListTool.handler(client, {} as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('workspacePublicId');
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

      const result = await boardListTool.handler(client, { workspacePublicId: 'ws-1' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeTruthy();
      }
    });
  });

  describe('board.create', () => {
    test('creates a board with default empty lists and labels', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = {
        workspacePublicId: 'ws-1',
        name: 'New Board',
      };
      const mockResponse = { publicId: 'board-new', name: 'New Board' };

      let receivedUrl = '';
      let receivedMethod = '';
      let receivedBody = '';

      globalThis.fetch = async (url, init) => {
        receivedUrl = url as string;
        receivedMethod = init?.method ?? 'GET';
        receivedBody = init?.body as string;
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await boardCreateTool.handler(client, input);

      expect(receivedMethod).toBe('POST');
      expect(receivedUrl).toContain('/workspaces/ws-1/boards');
      expect(JSON.parse(receivedBody)).toEqual({ name: 'New Board', lists: [], labels: [] });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockResponse);
      }
    });

    test('creates a board with initial lists and labels', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = {
        workspacePublicId: 'ws-1',
        name: 'Sprint Board',
        lists: ['To Do', 'Done'],
        labels: ['bug', 'feature'],
      };

      let receivedBody = '';

      globalThis.fetch = async (url, init) => {
        receivedBody = init?.body as string;
        return new Response(JSON.stringify({ publicId: 'board-2', name: 'Sprint Board' }), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await boardCreateTool.handler(client, input);

      expect(JSON.parse(receivedBody)).toEqual({
        name: 'Sprint Board',
        lists: ['To Do', 'Done'],
        labels: ['bug', 'feature'],
      });
      expect(result.ok).toBe(true);
    });

    test('passes type and sourceBoardPublicId when cloning', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = {
        workspacePublicId: 'ws-1',
        name: 'Cloned Board',
        type: 'template' as const,
        sourceBoardPublicId: 'board-source',
      };

      let receivedBody = '';

      globalThis.fetch = async (url, init) => {
        receivedBody = init?.body as string;
        return new Response(JSON.stringify({ publicId: 'board-3', name: 'Cloned Board' }), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await boardCreateTool.handler(client, input);

      expect(JSON.parse(receivedBody)).toEqual({
        name: 'Cloned Board',
        lists: [],
        labels: [],
        type: 'template',
        sourceBoardPublicId: 'board-source',
      });
      expect(result.ok).toBe(true);
    });

    test('returns error when workspacePublicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardCreateTool.handler(client, {
        name: 'Test',
      } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('workspacePublicId');
      }
    });

    test('returns error when name is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardCreateTool.handler(client, {
        workspacePublicId: 'ws-1',
      } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('name');
      }
    });

    test('returns error when lists contains non-strings', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardCreateTool.handler(client, {
        workspacePublicId: 'ws-1',
        name: 'Test',
        lists: ['ok', 42],
      } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('lists');
      }
    });
  });

  describe('board.getById', () => {
    test('returns board by public ID', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1' };

      globalThis.fetch = async () =>
        new Response(JSON.stringify(mockBoard), {
          status: 200,
          ok: true,
        }) as Response;

      const result = await boardGetByIdTool.handler(client, input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockBoard);
      }
    });

    test('returns error when publicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardGetByIdTool.handler(client, {} as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('publicId');
      }
    });

    test('passes dueDateFilters to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1', dueDateFilters: ['overdue', 'today'] };
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockBoard), { status: 200, ok: true }) as Response;
      };

      await boardGetByIdTool.handler(client, input);
      expect(decodeURIComponent(receivedUrl)).toContain('dueDateFilters=overdue,today');
    });

    test('passes members filter to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1', members: ['user-1', 'user-2'] };
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockBoard), { status: 200, ok: true }) as Response;
      };

      await boardGetByIdTool.handler(client, input);
      expect(decodeURIComponent(receivedUrl)).toContain('members=user-1,user-2');
    });

    test('passes labels filter to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1', labels: ['label-1', 'label-2'] };
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockBoard), { status: 200, ok: true }) as Response;
      };

      await boardGetByIdTool.handler(client, input);
      expect(decodeURIComponent(receivedUrl)).toContain('labels=label-1,label-2');
    });

    test('passes lists filter to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1', lists: ['list-1', 'list-2'] };
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockBoard), { status: 200, ok: true }) as Response;
      };

      await boardGetByIdTool.handler(client, input);
      expect(decodeURIComponent(receivedUrl)).toContain('lists=list-1,list-2');
    });

    test('passes type filter to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1', type: 'template' as const };
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockBoard), { status: 200, ok: true }) as Response;
      };

      await boardGetByIdTool.handler(client, input);
      expect(receivedUrl).toContain('type=template');
    });
  });

  describe('board.getBySlug', () => {
    test('returns board by workspace slug and board slug', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { workspaceSlug: 'my-workspace', boardSlug: 'test-board' };
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockBoard), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await boardGetBySlugTool.handler(client, input);

      expect(receivedUrl).toContain('/workspaces/my-workspace/boards/test-board');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockBoard);
      }
    });

    test('passes dueDateFilters to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { workspaceSlug: 'my-workspace', boardSlug: 'test-board', dueDateFilters: ['overdue'] };
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockBoard), { status: 200, ok: true }) as Response;
      };

      await boardGetBySlugTool.handler(client, input);
      expect(decodeURIComponent(receivedUrl)).toContain('dueDateFilters=overdue');
    });

    test('passes members filter to API', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { workspaceSlug: 'my-workspace', boardSlug: 'test-board', members: ['user-1'] };
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockBoard), { status: 200, ok: true }) as Response;
      };

      await boardGetBySlugTool.handler(client, input);
      expect(decodeURIComponent(receivedUrl)).toContain('members=user-1');
    });

    test('returns error when workspaceSlug is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardGetBySlugTool.handler(client, { boardSlug: 'test' } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('workspaceSlug');
      }
    });

    test('returns error when boardSlug is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardGetBySlugTool.handler(client, { workspaceSlug: 'my-workspace' } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('boardSlug');
      }
    });
  });

  describe('board.update', () => {
    test('updates a board', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1', name: 'Updated Name' };
      const updatedBoard = { ...mockBoard, name: 'Updated Name' };

      let receivedUrl = '';
      let receivedMethod = '';

      globalThis.fetch = async (url, init) => {
        receivedUrl = url as string;
        receivedMethod = init?.method ?? 'GET';
        return new Response(JSON.stringify(updatedBoard), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await boardUpdateTool.handler(client, input);

      expect(receivedMethod).toBe('PUT');
      expect(receivedUrl).toContain('/boards/board-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('Updated Name');
      }
    });

    test('updates board visibility', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1', visibility: 'private' as const };
      const updatedBoard = { ...mockBoard, visibility: 'private' as const };

      let receivedBody = '';

      globalThis.fetch = async (url, init) => {
        receivedBody = init?.body as string;
        return new Response(JSON.stringify(updatedBoard), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await boardUpdateTool.handler(client, input);

      expect(JSON.parse(receivedBody)).toEqual({ visibility: 'private' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.visibility).toBe('private');
      }
    });

    test('updates board slug, favorite and archived state', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1', slug: 'new-slug', favorite: true, isArchived: false };

      let receivedBody = '';

      globalThis.fetch = async (url, init) => {
        receivedBody = init?.body as string;
        return new Response(JSON.stringify(mockBoard), { status: 200, ok: true }) as Response;
      };

      const result = await boardUpdateTool.handler(client, input);

      expect(JSON.parse(receivedBody)).toEqual({ slug: 'new-slug', favorite: true, isArchived: false });
      expect(result.ok).toBe(true);
    });

    test('returns error when publicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardUpdateTool.handler(client, { name: 'Test' } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('publicId');
      }
    });
  });

  describe('board.delete', () => {
    test('deletes a board', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { publicId: 'board-1' };

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

      const result = await boardDeleteTool.handler(client, input);

      expect(receivedMethod).toBe('DELETE');
      expect(receivedUrl).toContain('/boards/board-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ success: true });
      }
    });

    test('returns error when publicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardDeleteTool.handler(client, {} as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('publicId');
      }
    });
  });

  describe('board.checkSlugAvailability', () => {
    test('returns available when slug is not reserved', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { boardPublicId: 'board-1', boardSlug: 'my-board' };
      const mockResponse = { isReserved: false };
      let receivedUrl = '';

      globalThis.fetch = async (url) => {
        receivedUrl = url as string;
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          ok: true,
        }) as Response;
      };

      const result = await boardCheckSlugAvailabilityTool.handler(client, input);

      expect(receivedUrl).toContain('/boards/board-1/check-slug-availability');
      expect(receivedUrl).toContain('boardSlug=my-board');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.available).toBe(true);
      }
    });

    test('returns unavailable when slug is reserved', async () => {
      const client = new KanClient(TEST_API_KEY);
      const input = { boardPublicId: 'board-1', boardSlug: 'taken-board' };
      const mockResponse = { isReserved: true };

      globalThis.fetch = async () =>
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          ok: true,
        }) as Response;

      const result = await boardCheckSlugAvailabilityTool.handler(client, input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.available).toBe(false);
      }
    });

    test('returns error when boardPublicId is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardCheckSlugAvailabilityTool.handler(client, { boardSlug: 'test' } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('boardPublicId');
      }
    });

    test('returns error when boardSlug is missing', async () => {
      const client = new KanClient(TEST_API_KEY);

      const result = await boardCheckSlugAvailabilityTool.handler(client, {
        boardPublicId: 'board-1',
      } as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('boardSlug');
      }
    });
  });

  describe('board.findByName', () => {
    test('finds board by workspace and board name', async () => {
      const client = new KanClient(TEST_API_KEY);
      const mockWorkspaces = [
        { role: 'admin', workspace: { publicId: 'ws-1', name: 'Project Alpha', slug: 'project-alpha', description: 'Test workspace', showEmailsToMembers: false, weekStartDay: 1 } },
      ];
      const mockBoards: Board[] = [
        { publicId: 'board-1', workspacePublicId: 'ws-1', name: 'Sprint 1', slug: 'sprint-1', visibility: 'public', type: 'regular', isArchived: false, favorite: false, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ];

      let boardsUrl = '';
      globalThis.fetch = async (url) => {
        if (String(url).includes('/boards')) boardsUrl = String(url);
        const payload = String(url).includes('/boards') ? mockBoards : mockWorkspaces;
        return new Response(JSON.stringify(payload), { status: 200, ok: true }) as Response;
      };

      const result = await boardFindByNameTool.handler(client, { workspaceName: 'project alpha', boardName: 'sprint 1' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.publicId).toBe('board-1');
      }
      expect(boardsUrl).toContain('/workspaces/ws-1/boards');
    });

    test('returns error when workspace not found', async () => {
      const client = new KanClient(TEST_API_KEY);
      globalThis.fetch = async () =>
        new Response(JSON.stringify([]), { status: 200, ok: true }) as Response;

      const result = await boardFindByNameTool.handler(client, { workspaceName: 'missing', boardName: 'anything' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('No workspace found');
      }
    });

    test('returns error when board not found', async () => {
      const client = new KanClient(TEST_API_KEY);
      const mockWorkspaces = [
        { role: 'admin', workspace: { publicId: 'ws-1', name: 'Project Alpha', slug: 'project-alpha', description: 'Test workspace', showEmailsToMembers: false, weekStartDay: 1 } },
      ];

      globalThis.fetch = async (url) => {
        const payload = String(url).includes('/boards') ? [] : mockWorkspaces;
        return new Response(JSON.stringify(payload), { status: 200, ok: true }) as Response;
      };

      const result = await boardFindByNameTool.handler(client, { workspaceName: 'Project Alpha', boardName: 'missing' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('No board found');
      }
    });
  });

});
