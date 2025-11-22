// API 调用模块 - 替代 IndexedDB
class NoteAPI {
    constructor() {
        this.baseURL = window.location.origin.includes('localhost')
            ? 'http://localhost:3000/api'
            : window.location.origin + '/api';
        this.token = localStorage.getItem('token');
    }

    // 获取请求头
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // 处理响应
    async handleResponse(response) {
        if (response.status === 401) {
            // Token 过期或无效，跳转到登录页
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            throw new Error('认证失败，请重新登录');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }

        return data;
    }

    // ==================== 笔记相关 API ====================

    // 获取所有笔记
    async getAllNotes() {
        const response = await fetch(`${this.baseURL}/notes`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // 添加笔记
    async addNote(note) {
        const response = await fetch(`${this.baseURL}/notes`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                title: note.title,
                content: note.content,
                type: note.type,
                tags: note.tags
            })
        });
        return this.handleResponse(response);
    }

    // 更新笔记
    async updateNote(note) {
        const response = await fetch(`${this.baseURL}/notes/${note.id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({
                title: note.title,
                content: note.content,
                type: note.type,
                tags: note.tags
            })
        });
        return this.handleResponse(response);
    }

    // 删除笔记
    async deleteNote(id) {
        const response = await fetch(`${this.baseURL}/notes/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // 按类型筛选笔记
    async getNotesByType(type) {
        const notes = await this.getAllNotes();
        if (type === 'all') {
            return notes;
        }
        return notes.filter(note => note.type === type);
    }

    // 搜索笔记
    async searchNotes(keyword) {
        const notes = await this.getAllNotes();
        const lowerKeyword = keyword.toLowerCase();
        return notes.filter(note =>
            note.title.toLowerCase().includes(lowerKeyword) ||
            note.content.toLowerCase().includes(lowerKeyword) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)))
        );
    }

    // 获取笔记统计
    async getStats() {
        const notes = await this.getAllNotes();
        return {
            total: notes.length,
            book: notes.filter(n => n.type === 'book').length,
            movie: notes.filter(n => n.type === 'movie').length,
            daily: notes.filter(n => n.type === 'daily').length
        };
    }

    // ==================== 每日计划相关 API ====================

    // 获取指定日期的计划
    async getPlanByDate(date) {
        const response = await fetch(`${this.baseURL}/plans?date=${date}`, {
            headers: this.getHeaders()
        });
        const data = await this.handleResponse(response);
        return data; // 返回数组
    }

    // 添加计划任务
    async addTask(task) {
        const response = await fetch(`${this.baseURL}/plans`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                date: task.date,
                task: task.task,
                completed: task.completed || false
            })
        });
        return this.handleResponse(response);
    }

    // 更新计划任务
    async updateTask(task) {
        const response = await fetch(`${this.baseURL}/plans/${task.id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({
                task: task.task,
                completed: task.completed
            })
        });
        return this.handleResponse(response);
    }

    // 删除计划任务
    async deleteTask(id) {
        const response = await fetch(`${this.baseURL}/plans/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // 检查是否有计划
    async hasPlanForDate(date) {
        const plans = await this.getPlanByDate(date);
        return plans.length > 0;
    }

    // 获取所有计划（用于历史计划）
    async getAllPlans() {
        const response = await fetch(`${this.baseURL}/plans/all`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    // 删除指定日期的所有计划
    async deletePlanByDate(date) {
        const plans = await this.getPlanByDate(date);
        const deletePromises = plans.map(plan => this.deleteTask(plan.id));
        await Promise.all(deletePromises);
    }

    // ==================== 导出/导入功能 ====================

    // 导出笔记
    async exportNotes() {
        const notes = await this.getAllNotes();
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalNotes: notes.length,
            notes: notes
        };
    }

    // 导入笔记
    async importNotes(notes) {
        const results = [];
        for (const note of notes) {
            try {
                // 检查是否已存在（通过标题和内容判断）
                const existing = await this.getAllNotes();
                const exists = existing.some(n =>
                    n.title === note.title && n.content === note.content
                );

                if (!exists) {
                    await this.addNote(note);
                    results.push({ success: true, note });
                } else {
                    results.push({ success: false, note, reason: 'already exists' });
                }
            } catch (error) {
                results.push({ success: false, note, error: error.message });
            }
        }
        return results;
    }

    // 导出计划
    async exportPlans() {
        const plans = await this.getAllPlans();
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalPlans: plans.length,
            plans: plans
        };
    }

    // 导入计划
    async importPlans(plans) {
        const results = [];
        for (const plan of plans) {
            try {
                // 检查是否已存在
                const existingPlans = await this.getPlanByDate(plan.date);
                const exists = existingPlans.some(p =>
                    p.task === plan.task && p.date === plan.date
                );

                if (exists) {
                    // 更新
                    const existing = existingPlans.find(p => p.task === plan.task);
                    await this.updateTask({ ...existing, ...plan });
                    results.push({ success: true, plan, action: 'updated' });
                } else {
                    // 新增
                    await this.addTask(plan);
                    results.push({ success: true, plan, action: 'created' });
                }
            } catch (error) {
                results.push({ success: false, plan, error: error.message });
            }
        }
        return results;
    }

    // ==================== 用户相关 ====================

    // 获取当前用户信息
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // 登出
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    // 检查登录状态
    isLoggedIn() {
        return !!localStorage.getItem('token');
    }
}

// 创建全局实例（保持与 db.js 相同的变量名以便替换）
const noteAPI = new NoteAPI();
const noteDB = noteAPI; // 别名，方便替换 IndexedDB
