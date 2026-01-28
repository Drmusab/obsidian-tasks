/**
 * @jest-environment jsdom
 */

import { QueryParser, QueryOperator, BooleanLogic, SortDirection } from '../../../src/siyuan/query/QueryParser';

describe('QueryParser', () => {
    describe('parse', () => {
        it('should parse a simple query', () => {
            const queryString = `
                tasks
                where status = TODO
                limit 50
            `;

            const query = QueryParser.parse(queryString);

            expect(query.filters).toHaveLength(1);
            expect(query.filters[0].field).toBe('status');
            expect(query.filters[0].operator).toBe(QueryOperator.EQUALS);
            expect(query.filters[0].value).toBe('TODO');
            expect(query.limit).toBe(50);
        });

        it('should parse query with multiple filters', () => {
            const queryString = `
                tasks
                where status != done
                and due <= today
                limit 100
            `;

            const query = QueryParser.parse(queryString);

            expect(query.filters).toHaveLength(2);
            expect(query.filters[0].field).toBe('status');
            expect(query.filters[0].operator).toBe(QueryOperator.NOT_EQUALS);
            
            expect(query.filters[1].field).toBe('due');
            expect(query.filters[1].operator).toBe(QueryOperator.LESS_THAN_OR_EQUAL);
            expect(query.filters[1].logic).toBe(BooleanLogic.AND);
        });

        it('should parse query with sort', () => {
            const queryString = `
                tasks
                where status = TODO
                sort by due asc
            `;

            const query = QueryParser.parse(queryString);

            expect(query.sorts).toHaveLength(1);
            expect(query.sorts[0].field).toBe('due');
            expect(query.sorts[0].direction).toBe(SortDirection.ASC);
        });

        it('should parse query with multiple sorts', () => {
            const queryString = `
                tasks
                sort by due asc
                sort by priority desc
            `;

            const query = QueryParser.parse(queryString);

            expect(query.sorts).toHaveLength(2);
            expect(query.sorts[0].field).toBe('due');
            expect(query.sorts[0].direction).toBe(SortDirection.ASC);
            expect(query.sorts[1].field).toBe('priority');
            expect(query.sorts[1].direction).toBe(SortDirection.DESC);
        });

        it('should parse query with OR logic', () => {
            const queryString = `
                tasks
                where status = TODO
                or status = DOING
            `;

            const query = QueryParser.parse(queryString);

            expect(query.filters).toHaveLength(2);
            expect(query.filters[1].logic).toBe(BooleanLogic.OR);
        });

        it('should parse includes operator', () => {
            const queryString = `
                tasks
                where tag includes work
            `;

            const query = QueryParser.parse(queryString);

            expect(query.filters).toHaveLength(1);
            expect(query.filters[0].operator).toBe(QueryOperator.CONTAINS);
        });

        it('should skip comments', () => {
            const queryString = `
                tasks
                # This is a comment
                where status = TODO
                # Another comment
                limit 50
            `;

            const query = QueryParser.parse(queryString);

            expect(query.filters).toHaveLength(1);
            expect(query.limit).toBe(50);
        });
    });

    describe('normalizeFieldName', () => {
        it('should normalize field aliases', () => {
            expect(QueryParser.normalizeFieldName('due')).toBe('due_date');
            expect(QueryParser.normalizeFieldName('scheduled')).toBe('scheduled_date');
            expect(QueryParser.normalizeFieldName('start')).toBe('start_date');
            expect(QueryParser.normalizeFieldName('tag')).toBe('tags');
        });

        it('should return field name if no alias exists', () => {
            expect(QueryParser.normalizeFieldName('status')).toBe('status');
            expect(QueryParser.normalizeFieldName('priority')).toBe('priority');
        });
    });

    describe('parseQueryDate', () => {
        it('should parse "today"', () => {
            const result = QueryParser.parseQueryDate('today');
            expect(result).toBeTruthy();
            
            // Verify it's today's date
            const today = new Date();
            const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            expect(result).toBe(expectedDate);
        });

        it('should parse "tomorrow"', () => {
            const result = QueryParser.parseQueryDate('tomorrow');
            expect(result).toBeTruthy();
            
            // Verify it's tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const expectedDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
            expect(result).toBe(expectedDate);
        });

        it('should parse "today + 7d"', () => {
            const result = QueryParser.parseQueryDate('today + 7d');
            expect(result).toBeTruthy();
            
            // Verify it's 7 days from today
            const future = new Date();
            future.setDate(future.getDate() + 7);
            const expectedDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
            expect(result).toBe(expectedDate);
        });

        it('should return as-is for absolute dates', () => {
            const result = QueryParser.parseQueryDate('2026-01-25');
            expect(result).toBe('2026-01-25');
        });
    });
});
