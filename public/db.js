/**
 * db.js - IndexedDB 数据库模块
 *
 * IndexedDB 是浏览器提供的本地数据库，特点：
 * 1. 容量大（通常 > 50MB）
 * 2. 支持索引和查询
 * 3. 异步操作（不阻塞 UI）
 * 4. 支持事务（保证数据一致性）
 *
 * 本模块封装了所有数据库操作，提供简洁的 API
 */

const DB_NAME = 'NoteAppDB';
const DB_VERSION = 2;
const STORE_NAME = 'notes';
const PLAN_STORE_NAME = 'dailyPlans';

class NoteDatabase {
    constructor() {
        this.db = null;
    }

    /**
     * 初始化数据库连接
     *
     * @returns {Promise<IDBDatabase>} 数据库实例
     */
    async init() {
        return new Promise((resolve, reject) => {
            // 打开数据库连接
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // 数据库升级/首次创建时触发
            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 如果对象存储不存在，创建它
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // 创建对象存储（类似于表）
                    // keyPath: 'id' 表示使用 id 字段作为主键
                    const objectStore = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id'
                    });

                    // 创建索引，用于快速查询
                    // 索引 1: 按笔记类型查询
                    objectStore.createIndex('type', 'type', { unique: false });

                    // 索引 2: 按日期查询和排序
                    objectStore.createIndex('date', 'date', { unique: false });

                    // 索引 3: 按最后修改时间查询
                    objectStore.createIndex('lastModified', 'lastModified', { unique: false });

                    console.log('📦 笔记数据库对象存储创建成功');
                }

                // 创建每日计划存储
                if (!db.objectStoreNames.contains(PLAN_STORE_NAME)) {
                    const planStore = db.createObjectStore(PLAN_STORE_NAME, {
                        keyPath: 'id'
                    });

                    // 按日期索引
                    planStore.createIndex('date', 'date', { unique: false });

                    console.log('📦 每日计划数据库对象存储创建成功');
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ 数据库连接成功');
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('❌ 数据库连接失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 添加新笔记
     *
     * @param {Object} note - 笔记对象
     * @returns {Promise<string>} 新笔记的 ID
     */
    async addNote(note) {
        return new Promise((resolve, reject) => {
            // 开启读写事务
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);

            // 生成唯一 ID
            note.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            note.lastModified = Date.now();

            // 添加数据
            const request = objectStore.add(note);

            request.onsuccess = () => {
                console.log('✅ 笔记添加成功:', note.id);
                resolve(note.id);
            };

            request.onerror = (event) => {
                console.error('❌ 笔记添加失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 更新笔记
     *
     * @param {Object} note - 更新后的笔记对象（必须包含 id）
     * @returns {Promise<void>}
     */
    async updateNote(note) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);

            // 更新最后修改时间
            note.lastModified = Date.now();

            // 更新数据（put 方法：存在则更新，不存在则添加）
            const request = objectStore.put(note);

            request.onsuccess = () => {
                console.log('✅ 笔记更新成功:', note.id);
                resolve();
            };

            request.onerror = (event) => {
                console.error('❌ 笔记更新失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 删除笔记
     *
     * @param {string} id - 笔记 ID
     * @returns {Promise<void>}
     */
    async deleteNote(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);

            const request = objectStore.delete(id);

            request.onsuccess = () => {
                console.log('✅ 笔记删除成功:', id);
                resolve();
            };

            request.onerror = (event) => {
                console.error('❌ 笔记删除失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 根据 ID 获取笔记
     *
     * @param {string} id - 笔记 ID
     * @returns {Promise<Object|null>} 笔记对象或 null
     */
    async getNoteById(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);

            const request = objectStore.get(id);

            request.onsuccess = (event) => {
                resolve(event.target.result || null);
            };

            request.onerror = (event) => {
                console.error('❌ 获取笔记失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 获取所有笔记
     *
     * @returns {Promise<Array>} 笔记数组
     */
    async getAllNotes() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);

            const request = objectStore.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result || []);
            };

            request.onerror = (event) => {
                console.error('❌ 获取所有笔记失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 按类型获取笔记
     *
     * @param {string} type - 笔记类型 ('book', 'movie', 'daily')
     * @returns {Promise<Array>} 笔记数组
     */
    async getNotesByType(type) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const index = objectStore.index('type');

            // 使用索引查询
            const request = index.getAll(type);

            request.onsuccess = (event) => {
                resolve(event.target.result || []);
            };

            request.onerror = (event) => {
                console.error('❌ 按类型获取笔记失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 搜索笔记
     *
     * @param {string} keyword - 搜索关键词
     * @returns {Promise<Array>} 匹配的笔记数组
     */
    async searchNotes(keyword) {
        const allNotes = await this.getAllNotes();
        const lowerKeyword = keyword.toLowerCase();

        // 在标题和内容中搜索
        return allNotes.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(lowerKeyword);
            const contentMatch = note.content.toLowerCase().includes(lowerKeyword);
            const tagsMatch = note.tags && note.tags.some(tag =>
                tag.toLowerCase().includes(lowerKeyword)
            );

            return titleMatch || contentMatch || tagsMatch;
        });
    }

    /**
     * 清空所有数据（用于导入前）
     *
     * @returns {Promise<void>}
     */
    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);

            const request = objectStore.clear();

            request.onsuccess = () => {
                console.log('✅ 数据库已清空');
                resolve();
            };

            request.onerror = (event) => {
                console.error('❌ 清空数据库失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 批量导入笔记
     *
     * @param {Array} notes - 笔记数组
     * @returns {Promise<void>}
     */
    async importNotes(notes) {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        for (const note of notes) {
            // 确保每个笔记都有必要的字段
            if (!note.id) {
                note.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            }
            if (!note.lastModified) {
                note.lastModified = Date.now();
            }
            objectStore.put(note);
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log(`✅ 成功导入 ${notes.length} 条笔记`);
                resolve();
            };

            transaction.onerror = (event) => {
                console.error('❌ 导入失败:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 获取笔记统计信息
     *
     * @returns {Promise<Object>} 统计对象
     */
    async getStats() {
        const allNotes = await this.getAllNotes();

        return {
            total: allNotes.length,
            book: allNotes.filter(n => n.type === 'book').length,
            movie: allNotes.filter(n => n.type === 'movie').length,
            daily: allNotes.filter(n => n.type === 'daily').length
        };
    }

    // ==================== 每日计划相关方法 ====================

    /**
     * 获取指定日期的计划
     *
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     * @returns {Promise<Array>} 任务数组
     */
    async getPlanByDate(date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PLAN_STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(PLAN_STORE_NAME);
            const index = objectStore.index('date');

            const request = index.getAll(date);

            request.onsuccess = (event) => {
                resolve(event.target.result || []);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * 添加任务
     *
     * @param {Object} task - 任务对象
     * @returns {Promise<string>} 任务 ID
     */
    async addTask(task) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PLAN_STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(PLAN_STORE_NAME);

            task.id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
            task.createdAt = Date.now();

            const request = objectStore.add(task);

            request.onsuccess = () => {
                resolve(task.id);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * 更新任务
     *
     * @param {Object} task - 任务对象
     * @returns {Promise<void>}
     */
    async updateTask(task) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PLAN_STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(PLAN_STORE_NAME);

            const request = objectStore.put(task);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * 删除任务
     *
     * @param {string} id - 任务 ID
     * @returns {Promise<void>}
     */
    async deleteTask(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PLAN_STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(PLAN_STORE_NAME);

            const request = objectStore.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * 检查指定日期是否有计划
     *
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     * @returns {Promise<boolean>}
     */
    async hasPlanForDate(date) {
        const tasks = await this.getPlanByDate(date);
        return tasks.length > 0;
    }

    /**
     * 获取所有计划任务
     *
     * @returns {Promise<Array>} 所有任务数组
     */
    async getAllPlans() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([PLAN_STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(PLAN_STORE_NAME);

            const request = objectStore.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result || []);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * 删除指定日期的所有任务
     *
     * @param {string} date - 日期字符串 (YYYY-MM-DD)
     * @returns {Promise<void>}
     */
    async deletePlanByDate(date) {
        return new Promise(async (resolve, reject) => {
            try {
                const tasks = await this.getPlanByDate(date);
                const transaction = this.db.transaction([PLAN_STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(PLAN_STORE_NAME);

                for (const task of tasks) {
                    objectStore.delete(task.id);
                }

                transaction.oncomplete = () => {
                    resolve();
                };

                transaction.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }
}

/**
 * ==================== IndexedDB 概念解释 ====================
 *
 * 1. **为什么选择 IndexedDB 而不是 localStorage？**
 *
 * localStorage:
 * - 优点：简单，同步 API
 * - 缺点：容量小（5-10MB），只能存储字符串，性能差
 *
 * IndexedDB:
 * - 优点：容量大（> 50MB），支持复杂数据类型，异步不阻塞
 * - 缺点：API 复杂（本模块已封装）
 *
 * 2. **IndexedDB 核心概念**
 *
 * - Database（数据库）：整个存储空间
 * - Object Store（对象存储）：类似 SQL 的"表"
 * - Index（索引）：加速查询的数据结构
 * - Transaction（事务）：保证操作的原子性
 * - Cursor（游标）：遍历大量数据
 *
 * 3. **事务类型**
 *
 * - readonly：只读，可并发
 * - readwrite：读写，互斥
 * - versionchange：升级数据库结构
 *
 * 4. **索引的作用**
 *
 * 没有索引：需要遍历所有数据 O(n)
 * 有索引：快速定位 O(log n)
 *
 * 本应用创建的索引：
 * - type: 快速筛选笔记类型
 * - date: 按日期排序
 * - lastModified: 按修改时间排序
 *
 * 5. **数据持久化**
 *
 * IndexedDB 数据存储位置：
 * - Chrome: C:\Users\<用户>\AppData\Local\Google\Chrome\User Data\Default\IndexedDB
 * - Firefox: profiles/<随机>/storage/default
 *
 * 数据不会过期，除非：
 * - 用户手动清除浏览器数据
 * - 浏览器存储空间不足（罕见）
 * - 代码主动删除
 *
 * 6. **错误处理**
 *
 * 常见错误：
 * - QuotaExceededError: 存储空间不足
 * - ConstraintError: 主键冲突
 * - NotFoundError: 数据不存在
 *
 * 本模块使用 Promise 封装，统一错误处理
 */

// 导出全局数据库实例
const noteDB = new NoteDatabase();
