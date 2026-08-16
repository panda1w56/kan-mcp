import { KanClient } from '../client.js';
import { Card, ToolResult, ROUTES, ActivityPage } from '../types.js';
import { success, error, assertString, assertOptionalString, assertNumber, sanitizeHtml } from '../utils.js';
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

export const cardCreateTool: Tool<CardCreateInput, Card> = {
  name: 'card.create',
  description: 'Create a new card. The description field accepts HTML for rich text formatting.',
  inputSchema: {
    type: 'object',
    properties: {
      listPublicId: { type: 'string' },
      title: { type: 'string' },
      description: { 
        type: 'string',
        description: 'HTML content. Use <p> for paragraphs, <br> for line breaks, <a href="...">link</a> for links. Plain text with \n will NOT render correctly.'
      },
      dueDate: { type: 'string' },
    },
    required: ['listPublicId', 'title'],
  },
  handler: async (client: KanClient, input: CardCreateInput): Promise<ToolResult<Card>> => {
    try {
      assertString(input.listPublicId, 'listPublicId');
      assertString(input.title, 'title');
      assertOptionalString(input.description, 'description');
      assertOptionalString(input.dueDate, 'dueDate');
      const body: Record<string, unknown> = {
        listPublicId: input.listPublicId,
        title: input.title,
        description: input.description ? sanitizeHtml(input.description) : '',
        labelPublicIds: [],
        memberPublicIds: [],
        position: 'start',
      };
      if (input.dueDate !== undefined) body.dueDate = input.dueDate;
      const data = await client.request<Card>(ROUTES.CARDS, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

interface CardCreateInput {
  listPublicId: string;
  title: string;
  description?: string;
  dueDate?: string;
}

interface CardGetByIdInput {
  publicId: string;
}

interface CardUpdateInput {
  publicId: string;
  title?: string;
  description?: string;
  dueDate?: string;
  index?: number;
}

interface CardDeleteInput {
  publicId: string;
}

interface CardDuplicateInput {
  cardPublicId: string;
  targetListPublicId?: string;
  copyLabels?: boolean;
  copyMembers?: boolean;
  copyChecklists?: boolean;
  title?: string;
}

interface CardAddLabelInput {
  cardPublicId: string;
  labelPublicId: string;
}

interface CardRemoveLabelInput {
  cardPublicId: string;
  labelPublicId: string;
}

interface CardAddMemberInput {
  cardPublicId: string;
  memberPublicId: string;
}

interface CardRemoveMemberInput {
  cardPublicId: string;
  memberPublicId: string;
}

interface CardListActivitiesInput {
  cardPublicId: string;
  limit?: number;
  cursor?: string;
}

/** Minimal card shape needed to check attached labels/members before toggling */
interface CardDetailLite {
  labels?: { publicId: string }[];
  members?: { publicId: string }[];
}

async function getAttachedIds(
  client: KanClient,
  cardPublicId: string,
  field: 'labels' | 'members'
): Promise<string[]> {
  const card = await client.request<CardDetailLite>(`${ROUTES.CARDS}/${cardPublicId}`);
  return (card[field] ?? []).map((item) => item.publicId);
}

export const cardGetByIdTool: Tool<CardGetByIdInput, Card> = {
  name: 'card.getById',
  description: 'Get card by public ID',
  inputSchema: {
    type: 'object',
    properties: {
      publicId: { type: 'string' },
    },
    required: ['publicId'],
  },
  handler: async (client: KanClient, input: CardGetByIdInput): Promise<ToolResult<Card>> => {
    try {
      assertString(input.publicId, 'publicId');
      const data = await client.request<Card>(`${ROUTES.CARDS}/${input.publicId}`);
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const cardUpdateTool: Tool<CardUpdateInput, Card> = {
  name: 'card.update',
  description: 'Update a card. The description field accepts HTML for rich text formatting.',
  inputSchema: {
    type: 'object',
    properties: {
      publicId: { type: 'string' },
      title: { type: 'string' },
      description: { 
        type: 'string',
        description: 'HTML content. Use <p> for paragraphs, <br> for line breaks, <a href="...">link</a> for links. Plain text with \n will NOT render correctly.'
      },
      dueDate: { type: 'string' },
      index: { type: 'number' },
    },
    required: ['publicId'],
  },
  handler: async (client: KanClient, input: CardUpdateInput): Promise<ToolResult<Card>> => {
    try {
      assertString(input.publicId, 'publicId');
      assertOptionalString(input.title, 'title');
      assertOptionalString(input.description, 'description');
      assertOptionalString(input.dueDate, 'dueDate');
      const body: Record<string, unknown> = {};
      if (input.title !== undefined) body.title = input.title;
      if (input.description !== undefined) body.description = sanitizeHtml(input.description);
      if (input.dueDate !== undefined) body.dueDate = input.dueDate;
      if (input.index !== undefined) body.index = input.index;
      const data = await client.request<Card>(`${ROUTES.CARDS}/${input.publicId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const cardDeleteTool: Tool<CardDeleteInput, { success: boolean }> = {
  name: 'card.delete',
  description: 'Delete a card',
  inputSchema: {
    type: 'object',
    properties: {
      publicId: { type: 'string' },
    },
    required: ['publicId'],
  },
  handler: async (client: KanClient, input: CardDeleteInput): Promise<ToolResult<{ success: boolean }>> => {
    try {
      assertString(input.publicId, 'publicId');
      await client.request(`${ROUTES.CARDS}/${input.publicId}`, {
        method: 'DELETE',
      });
      return success({ success: true });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const cardDuplicateTool: Tool<CardDuplicateInput, Card> = {
  name: 'card.duplicate',
  description: 'Duplicate a card to a target list. copyLabels, copyMembers and copyChecklists default to true.',
  inputSchema: {
    type: 'object',
    properties: {
      cardPublicId: { type: 'string' },
      targetListPublicId: { type: 'string' },
      copyLabels: { type: 'boolean' },
      copyMembers: { type: 'boolean' },
      copyChecklists: { type: 'boolean' },
      title: { type: 'string' },
    },
    required: ['cardPublicId', 'targetListPublicId'],
  },
  handler: async (client: KanClient, input: CardDuplicateInput): Promise<ToolResult<Card>> => {
    try {
      assertString(input.cardPublicId, 'cardPublicId');
      assertString(input.targetListPublicId, 'targetListPublicId');
      assertOptionalString(input.title, 'title');
      const body: Record<string, unknown> = {
        listPublicId: input.targetListPublicId,
        copyLabels: input.copyLabels ?? true,
        copyMembers: input.copyMembers ?? true,
        copyChecklists: input.copyChecklists ?? true,
      };
      if (input.title !== undefined) body.title = input.title;
      const data = await client.request<Card>(`${ROUTES.CARDS}/${input.cardPublicId}/duplicate`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const cardAddLabelTool: Tool<CardAddLabelInput, { attached: boolean }> = {
  name: 'card.addLabel',
  description: 'Add label to card. Idempotent: does nothing if the label is already attached.',
  inputSchema: {
    type: 'object',
    properties: {
      cardPublicId: { type: 'string' },
      labelPublicId: { type: 'string' },
    },
    required: ['cardPublicId', 'labelPublicId'],
  },
  handler: async (client: KanClient, input: CardAddLabelInput): Promise<ToolResult<{ attached: boolean }>> => {
    try {
      assertString(input.cardPublicId, 'cardPublicId');
      assertString(input.labelPublicId, 'labelPublicId');
      const attached = await getAttachedIds(client, input.cardPublicId, 'labels');
      if (attached.includes(input.labelPublicId)) {
        return success({ attached: true });
      }
      await client.request<{ newLabel: boolean }>(
        `${ROUTES.CARDS}/${input.cardPublicId}/labels/${input.labelPublicId}`,
        { method: 'PUT' }
      );
      return success({ attached: true });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const cardRemoveLabelTool: Tool<CardRemoveLabelInput, { attached: boolean }> = {
  name: 'card.removeLabel',
  description: 'Remove label from card. Idempotent: does nothing if the label is not attached.',
  inputSchema: {
    type: 'object',
    properties: {
      cardPublicId: { type: 'string' },
      labelPublicId: { type: 'string' },
    },
    required: ['cardPublicId', 'labelPublicId'],
  },
  handler: async (client: KanClient, input: CardRemoveLabelInput): Promise<ToolResult<{ attached: boolean }>> => {
    try {
      assertString(input.cardPublicId, 'cardPublicId');
      assertString(input.labelPublicId, 'labelPublicId');
      const attached = await getAttachedIds(client, input.cardPublicId, 'labels');
      if (!attached.includes(input.labelPublicId)) {
        return success({ attached: false });
      }
      await client.request<{ newLabel: boolean }>(
        `${ROUTES.CARDS}/${input.cardPublicId}/labels/${input.labelPublicId}`,
        { method: 'PUT' }
      );
      return success({ attached: false });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const cardAddMemberTool: Tool<CardAddMemberInput, { attached: boolean }> = {
  name: 'card.addMember',
  description: 'Add member to card. Idempotent: does nothing if the member is already attached.',
  inputSchema: {
    type: 'object',
    properties: {
      cardPublicId: { type: 'string' },
      memberPublicId: { type: 'string' },
    },
    required: ['cardPublicId', 'memberPublicId'],
  },
  handler: async (client: KanClient, input: CardAddMemberInput): Promise<ToolResult<{ attached: boolean }>> => {
    try {
      assertString(input.cardPublicId, 'cardPublicId');
      assertString(input.memberPublicId, 'memberPublicId');
      const attached = await getAttachedIds(client, input.cardPublicId, 'members');
      if (attached.includes(input.memberPublicId)) {
        return success({ attached: true });
      }
      await client.request<{ newMember: boolean }>(
        `${ROUTES.CARDS}/${input.cardPublicId}/members/${input.memberPublicId}`,
        { method: 'PUT' }
      );
      return success({ attached: true });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const cardRemoveMemberTool: Tool<CardRemoveMemberInput, { attached: boolean }> = {
  name: 'card.removeMember',
  description: 'Remove member from card. Idempotent: does nothing if the member is not attached.',
  inputSchema: {
    type: 'object',
    properties: {
      cardPublicId: { type: 'string' },
      memberPublicId: { type: 'string' },
    },
    required: ['cardPublicId', 'memberPublicId'],
  },
  handler: async (client: KanClient, input: CardRemoveMemberInput): Promise<ToolResult<{ attached: boolean }>> => {
    try {
      assertString(input.cardPublicId, 'cardPublicId');
      assertString(input.memberPublicId, 'memberPublicId');
      const attached = await getAttachedIds(client, input.cardPublicId, 'members');
      if (!attached.includes(input.memberPublicId)) {
        return success({ attached: false });
      }
      await client.request<{ newMember: boolean }>(
        `${ROUTES.CARDS}/${input.cardPublicId}/members/${input.memberPublicId}`,
        { method: 'PUT' }
      );
      return success({ attached: false });
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};

export const cardListActivitiesTool: Tool<CardListActivitiesInput, ActivityPage> = {
  name: 'card.listActivities',
  description: 'Get card activities',
  inputSchema: {
    type: 'object',
    properties: {
      cardPublicId: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 100 },
      cursor: { type: 'string', description: 'ISO timestamp cursor for pagination' },
    },
    required: ['cardPublicId'],
  },
  handler: async (client: KanClient, input: CardListActivitiesInput): Promise<ToolResult<ActivityPage>> => {
    try {
      assertString(input.cardPublicId, 'cardPublicId');
      const queryParams = new URLSearchParams();
      if (input.limit !== undefined) queryParams.set('limit', String(input.limit));
      if (input.cursor) queryParams.set('cursor', input.cursor);
      const query = queryParams.toString();
      const path = `${ROUTES.CARDS}/${input.cardPublicId}/activities${query ? `?${query}` : ''}`;
      const data = await client.request<ActivityPage>(path);
      return success(data);
    } catch (err) {
      return error(toMcpError(err).message);
    }
  },
};
