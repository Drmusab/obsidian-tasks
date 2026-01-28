/**
 * @jest-environment jsdom
 */

import { TaskSyntaxParser } from '../../../src/siyuan/parser/TaskSyntaxParser';
import { TaskStatus, TaskPriority } from '../../../src/siyuan/types/TaskData';

describe('TaskSyntaxParser', () => {
    describe('parseTaskLine', () => {
        it('should parse a simple task', () => {
            const line = '- [ ] Buy groceries';
            const task = TaskSyntaxParser.parseTaskLine(line, 'block-123');

            expect(task).not.toBeNull();
            expect(task?.description).toBe('Buy groceries');
            expect(task?.status).toBe(TaskStatus.TODO);
            expect(task?.source_block_id).toBe('block-123');
        });

        it('should parse a task with due date', () => {
            const line = '- [ ] Complete report @due(2026-01-25)';
            const task = TaskSyntaxParser.parseTaskLine(line, 'block-123');

            expect(task).not.toBeNull();
            expect(task?.description).toBe('Complete report');
            expect(task?.due_date).toBe('2026-01-25');
        });

        it('should parse a task with priority', () => {
            const line = '- [ ] Important task @priority(high)';
            const task = TaskSyntaxParser.parseTaskLine(line, 'block-123');

            expect(task).not.toBeNull();
            expect(task?.description).toBe('Important task');
            expect(task?.priority).toBe(TaskPriority.HIGH);
        });

        it('should parse a task with multiple signifiers', () => {
            const line = '- [ ] Review code @due(2026-01-25) @priority(high) @scheduled(2026-01-24)';
            const task = TaskSyntaxParser.parseTaskLine(line, 'block-123');

            expect(task).not.toBeNull();
            expect(task?.description).toBe('Review code');
            expect(task?.due_date).toBe('2026-01-25');
            expect(task?.scheduled_date).toBe('2026-01-24');
            expect(task?.priority).toBe(TaskPriority.HIGH);
        });

        it('should parse a completed task', () => {
            const line = '- [x] Finished task';
            const task = TaskSyntaxParser.parseTaskLine(line, 'block-123');

            expect(task).not.toBeNull();
            expect(task?.status).toBe(TaskStatus.DONE);
        });

        it('should parse relative dates - today', () => {
            const line = '- [ ] Task @due(today)';
            const task = TaskSyntaxParser.parseTaskLine(line, 'block-123');

            expect(task).not.toBeNull();
            expect(task?.due_date).toBeDefined();
            
            // Verify it's today's date
            const today = new Date();
            const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            expect(task?.due_date).toBe(expectedDate);
        });

        it('should parse relative dates - tomorrow', () => {
            const line = '- [ ] Task @due(tomorrow)';
            const task = TaskSyntaxParser.parseTaskLine(line, 'block-123');

            expect(task).not.toBeNull();
            expect(task?.due_date).toBeDefined();
            
            // Verify it's tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const expectedDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
            expect(task?.due_date).toBe(expectedDate);
        });

        it('should parse recurrence', () => {
            const line = '- [ ] Task @recur(every week)';
            const task = TaskSyntaxParser.parseTaskLine(line, 'block-123');

            expect(task).not.toBeNull();
            expect(task?.recurrence_rule).toBe('every week');
        });

        it('should return null for non-task lines', () => {
            const line = 'This is not a task';
            const task = TaskSyntaxParser.parseTaskLine(line, 'block-123');

            expect(task).toBeNull();
        });
    });

    describe('serializeTask', () => {
        it('should serialize a simple task', () => {
            const task = TaskSyntaxParser.parseTaskLine('- [ ] Test task', 'block-123');
            expect(task).not.toBeNull();

            const serialized = TaskSyntaxParser.serializeTask(task!);
            expect(serialized).toContain('Test task');
            expect(serialized).toContain('[ ]');
        });

        it('should serialize a task with signifiers', () => {
            const task = TaskSyntaxParser.parseTaskLine(
                '- [ ] Task @due(2026-01-25) @priority(high)',
                'block-123'
            );
            expect(task).not.toBeNull();

            const serialized = TaskSyntaxParser.serializeTask(task!);
            expect(serialized).toContain('Task');
            expect(serialized).toContain('@due(2026-01-25)');
            expect(serialized).toContain('@priority(high)');
        });
    });
});
