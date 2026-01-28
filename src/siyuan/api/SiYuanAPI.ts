/**
 * SiYuan API wrapper for block operations
 */

import type { TaskBlockAttributes } from '../types/TaskData';

/**
 * Response from SiYuan API
 */
interface SiYuanResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

/**
 * Block information from SiYuan
 */
export interface BlockInfo {
    id: string;
    content: string;
    type: string;
    subtype?: string;
    [key: string]: any;
}

/**
 * Wrapper for SiYuan API calls
 */
export class SiYuanAPI {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://127.0.0.1:6806') {
        this.baseUrl = baseUrl;
    }

    /**
     * Make an API request to SiYuan
     */
    private async request<T>(endpoint: string, data: any): Promise<SiYuanResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`SiYuan API request failed: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Set block attributes
     */
    async setBlockAttrs(blockId: string, attrs: Partial<TaskBlockAttributes>): Promise<void> {
        const result = await this.request('/api/attr/setBlockAttrs', {
            id: blockId,
            attrs,
        });

        if (result.code !== 0) {
            throw new Error(`Failed to set block attributes: ${result.msg}`);
        }
    }

    /**
     * Get block attributes
     */
    async getBlockAttrs(blockId: string): Promise<Record<string, string>> {
        const result = await this.request<Record<string, string>>('/api/attr/getBlockAttrs', {
            id: blockId,
        });

        if (result.code !== 0) {
            throw new Error(`Failed to get block attributes: ${result.msg}`);
        }

        return result.data;
    }

    /**
     * Get block information by ID
     */
    async getBlockByID(blockId: string): Promise<BlockInfo | null> {
        const result = await this.request<BlockInfo>('/api/block/getBlockInfo', {
            id: blockId,
        });

        if (result.code !== 0) {
            return null;
        }

        return result.data;
    }

    /**
     * Update block content
     */
    async updateBlock(blockId: string, content: string): Promise<void> {
        const result = await this.request('/api/block/updateBlock', {
            id: blockId,
            data: content,
            dataType: 'markdown',
        });

        if (result.code !== 0) {
            throw new Error(`Failed to update block: ${result.msg}`);
        }
    }

    /**
     * Query blocks using SQL
     */
    async querySQL(sql: string): Promise<any[]> {
        const result = await this.request<any[]>('/api/query/sql', {
            stmt: sql,
        });

        if (result.code !== 0) {
            throw new Error(`Failed to execute SQL query: ${result.msg}`);
        }

        return result.data;
    }

    /**
     * Get all blocks in a notebook
     */
    async getNotebookBlocks(notebookId: string): Promise<BlockInfo[]> {
        const sql = `SELECT * FROM blocks WHERE box = '${notebookId}'`;
        return await this.querySQL(sql);
    }

    /**
     * Search for blocks by content
     */
    async searchBlocks(query: string): Promise<BlockInfo[]> {
        const result = await this.request<{ blocks: BlockInfo[] }>('/api/search/fullTextSearchBlock', {
            query,
        });

        if (result.code !== 0) {
            throw new Error(`Failed to search blocks: ${result.msg}`);
        }

        return result.data.blocks || [];
    }

    /**
     * Insert a new block
     */
    async insertBlock(
        previousBlockId: string,
        content: string,
        dataType: string = 'markdown',
    ): Promise<string> {
        const result = await this.request<{ id: string }>('/api/block/insertBlock', {
            previousID: previousBlockId,
            data: content,
            dataType,
        });

        if (result.code !== 0) {
            throw new Error(`Failed to insert block: ${result.msg}`);
        }

        return result.data.id;
    }

    /**
     * Delete a block
     */
    async deleteBlock(blockId: string): Promise<void> {
        const result = await this.request('/api/block/deleteBlock', {
            id: blockId,
        });

        if (result.code !== 0) {
            throw new Error(`Failed to delete block: ${result.msg}`);
        }
    }

    /**
     * Get all notebooks
     */
    async getNotebooks(): Promise<any[]> {
        const result = await this.request<{ notebooks: any[] }>('/api/notebook/lsNotebooks', {});

        if (result.code !== 0) {
            throw new Error(`Failed to get notebooks: ${result.msg}`);
        }

        return result.data.notebooks || [];
    }
}
