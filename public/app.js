/**
 * app.js - 主应用逻辑
 *
 * 负责：
 * 1. 视图切换和导航
 * 2. UI 渲染
 * 3. 用户交互处理
 * 4. 数据的增删改查
 */

// ==================== 应用状态 ====================

const appState = {
    currentView: 'list',        // 当前视图: 'list' | 'detail' | 'form' | 'export' | 'import'
    currentFilter: 'all',       // 当前筛选: 'all' | 'book' | 'movie' | 'daily'
    currentNoteId: null,        // 当前查看/编辑的笔记 ID
    isEditMode: false,          // 是否编辑模式
    searchKeyword: '',          // 搜索关键词
    sortBy: 'date-desc',        // 排序方式
    selectedExportNotes: new Set(), // 选中要导出的笔记 ID
    importData: null            // 待导入的数据
};

// ==================== 用户认证相关 ====================

/**
 * 退出登录
 */
function logout() {
    noteAPI.logout(); // 使用 API 模块的登出方法
}

// ==================== Markdown 相关 ====================

let isPreviewMode = false;

/**
 * 切换 Markdown 预览
 */
function toggleMarkdownPreview() {
    const textarea = document.getElementById('noteContent');
    const preview = document.getElementById('markdownPreview');
    const previewBtn = document.getElementById('togglePreviewBtn');

    isPreviewMode = !isPreviewMode;

    if (isPreviewMode) {
        // 显示预览
        preview.style.display = 'block';
        previewBtn.classList.add('active');
        previewBtn.innerHTML = '✏️ 编辑';
        updateMarkdownPreview();
    } else {
        // 隐藏预览
        preview.style.display = 'none';
        previewBtn.classList.remove('active');
        previewBtn.innerHTML = '👁️ 预览';
    }
}

/**
 * 更新 Markdown 预览内容
 */
function updateMarkdownPreview() {
    if (!isPreviewMode) return;

    const textarea = document.getElementById('noteContent');
    const previewContent = document.querySelector('#markdownPreview .preview-content');

    if (textarea && previewContent) {
        const content = textarea.value || '';
        if (content.trim()) {
            previewContent.innerHTML = marked.parse(content);
        } else {
            previewContent.innerHTML = '<p style="color: var(--text-muted);">预览区域 - 开始输入内容...</p>';
        }
    }
}

/**
 * 插入 Markdown 语法
 */
function insertMarkdown(type) {
    const textarea = document.getElementById('noteContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let insertion = '';
    let cursorOffset = 0;

    switch (type) {
        case 'bold':
            insertion = `**${selectedText || '粗体文本'}**`;
            cursorOffset = selectedText ? insertion.length : 2;
            break;
        case 'italic':
            insertion = `*${selectedText || '斜体文本'}*`;
            cursorOffset = selectedText ? insertion.length : 1;
            break;
        case 'heading':
            insertion = `## ${selectedText || '标题'}`;
            cursorOffset = selectedText ? insertion.length : 3;
            break;
        case 'quote':
            insertion = `> ${selectedText || '引用内容'}`;
            cursorOffset = selectedText ? insertion.length : 2;
            break;
        case 'code':
            if (selectedText.includes('\n')) {
                insertion = `\`\`\`\n${selectedText || '代码'}\n\`\`\``;
                cursorOffset = selectedText ? insertion.length : 4;
            } else {
                insertion = `\`${selectedText || '代码'}\``;
                cursorOffset = selectedText ? insertion.length : 1;
            }
            break;
        case 'link':
            insertion = `[${selectedText || '链接文本'}](url)`;
            cursorOffset = selectedText ? insertion.length - 4 : 1;
            break;
        case 'ul':
            insertion = `- ${selectedText || '列表项'}`;
            cursorOffset = selectedText ? insertion.length : 2;
            break;
        case 'ol':
            insertion = `1. ${selectedText || '列表项'}`;
            cursorOffset = selectedText ? insertion.length : 3;
            break;
        default:
            return;
    }

    // 插入文本
    textarea.value = text.substring(0, start) + insertion + text.substring(end);

    // 设置光标位置
    const newPos = start + cursorOffset;
    textarea.setSelectionRange(newPos, newPos);
    textarea.focus();

    // 更新预览
    updateMarkdownPreview();
}

/**
 * 渲染 Markdown 内容（用于详情页）
 */
function renderMarkdown(content) {
    if (!content) return '';
    try {
        return marked.parse(content);
    } catch (error) {
        console.error('Markdown 解析错误:', error);
        return escapeHtml(content).replace(/\n/g, '<br>');
    }
}

// ==================== 工具函数 ====================

/**
 * 笔记类型配置
 */
const NOTE_TYPES = {
    book: {
        name: '读书笔记',
        icon: '📚',
        color: '#4CAF50'
    },
    movie: {
        name: '观影笔记',
        icon: '🎬',
        color: '#2196F3'
    },
    daily: {
        name: '日常笔记',
        icon: '📅',
        color: '#FF9800'
    }
};

/**
 * 格式化日期
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * 显示 Toast 通知
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * 切换视图
 */
function switchView(viewName) {
    // 隐藏所有视图
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // 显示目标视图
    const targetView = document.getElementById(`${viewName}View`);
    if (targetView) {
        targetView.classList.add('active');
        appState.currentView = viewName;
    }
}

// ==================== 笔记列表相关 ====================

/**
 * 加载并显示笔记列表
 */
async function loadNotesList() {
    try {
        let notes;

        // 根据筛选条件获取笔记
        if (appState.currentFilter === 'all') {
            notes = await noteDB.getAllNotes();
        } else {
            notes = await noteDB.getNotesByType(appState.currentFilter);
        }

        // 搜索过滤
        if (appState.searchKeyword) {
            const keyword = appState.searchKeyword.toLowerCase();
            notes = notes.filter(note => {
                const titleMatch = note.title.toLowerCase().includes(keyword);
                const contentMatch = note.content.toLowerCase().includes(keyword);
                const tagsMatch = note.tags && note.tags.some(tag =>
                    tag.toLowerCase().includes(keyword)
                );
                return titleMatch || contentMatch || tagsMatch;
            });
        }

        // 排序
        notes = sortNotes(notes, appState.sortBy);

        // 渲染列表
        renderNotesList(notes);

        // 更新统计数字
        await updateStats();

    } catch (error) {
        console.error('加载笔记列表失败:', error);
        showToast('加载笔记失败', 'error');
    }
}

/**
 * 排序笔记
 */
function sortNotes(notes, sortBy) {
    const sortedNotes = [...notes];

    switch (sortBy) {
        case 'date-desc':
            return sortedNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'date-asc':
            return sortedNotes.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'title-asc':
            return sortedNotes.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        default:
            return sortedNotes;
    }
}

/**
 * 渲染笔记列表
 */
function renderNotesList(notes) {
    const notesList = document.getElementById('notesList');
    const emptyState = document.getElementById('emptyState');

    if (notes.length === 0) {
        notesList.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    notesList.innerHTML = notes.map(note => {
        const typeConfig = NOTE_TYPES[note.type];
        const preview = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
        const tagsHtml = note.tags && note.tags.length > 0
            ? note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '';

        return `
            <div class="note-card" data-id="${note.id}" onclick="viewNoteDetail('${note.id}')">
                <div class="note-card-header">
                    <span class="note-type-badge" style="background-color: ${typeConfig.color}">
                        ${typeConfig.icon} ${typeConfig.name}
                    </span>
                    <span class="note-date">${formatDate(note.createdAt)}</span>
                </div>
                <h3 class="note-card-title">${escapeHtml(note.title)}</h3>
                ${note.itemTitle ? `<div class="note-subtitle">${typeConfig.icon} ${escapeHtml(note.itemTitle)}</div>` : ''}
                ${note.rating ? `<div class="note-rating">${'⭐'.repeat(Math.floor(note.rating))}</div>` : ''}
                <p class="note-card-preview">${escapeHtml(preview)}</p>
                ${tagsHtml ? `<div class="note-tags">${tagsHtml}</div>` : ''}
            </div>
        `;
    }).join('');
}

/**
 * 转义 HTML 特殊字符（防止 XSS）
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 更新统计数字
 */
async function updateStats() {
    const stats = await noteDB.getStats();

    document.getElementById('count-all').textContent = stats.total;
    document.getElementById('count-book').textContent = stats.book;
    document.getElementById('count-movie').textContent = stats.movie;
    document.getElementById('count-daily').textContent = stats.daily;
}

// ==================== 笔记详情相关 ====================

/**
 * 查看笔记详情
 */
async function viewNoteDetail(noteId) {
    try {
        const note = await noteDB.getNoteById(noteId);
        if (!note) {
            showToast('笔记不存在', 'error');
            return;
        }

        appState.currentNoteId = noteId;
        renderNoteDetail(note);
        switchView('detail');

    } catch (error) {
        console.error('加载笔记详情失败:', error);
        showToast('加载详情失败', 'error');
    }
}

/**
 * 渲染笔记详情
 */
function renderNoteDetail(note) {
    const detailContainer = document.getElementById('noteDetail');
    const typeConfig = NOTE_TYPES[note.type];

    let specificFields = '';

    // 根据类型显示特定字段
    if (note.type === 'book') {
        specificFields = `
            ${note.bookTitle ? `<div class="detail-field">
                <label>📚 书名</label>
                <div class="detail-value">${escapeHtml(note.bookTitle)}</div>
            </div>` : ''}
            ${note.author ? `<div class="detail-field">
                <label>✍️ 作者</label>
                <div class="detail-value">${escapeHtml(note.author)}</div>
            </div>` : ''}
            ${note.rating ? `<div class="detail-field">
                <label>⭐ 评分</label>
                <div class="detail-value">${'⭐'.repeat(Math.floor(note.rating))} ${note.rating}/5</div>
            </div>` : ''}
        `;
    } else if (note.type === 'movie') {
        specificFields = `
            ${note.movieTitle ? `<div class="detail-field">
                <label>🎬 影片名称</label>
                <div class="detail-value">${escapeHtml(note.movieTitle)}</div>
            </div>` : ''}
            ${note.director ? `<div class="detail-field">
                <label>🎥 导演</label>
                <div class="detail-value">${escapeHtml(note.director)}</div>
            </div>` : ''}
            ${note.actors ? `<div class="detail-field">
                <label>🎭 主要演员</label>
                <div class="detail-value">${escapeHtml(note.actors)}</div>
            </div>` : ''}
            ${note.rating ? `<div class="detail-field">
                <label>⭐ 评分</label>
                <div class="detail-value">${'⭐'.repeat(Math.floor(note.rating))} ${note.rating}/5</div>
            </div>` : ''}
        `;
    }

    const tagsHtml = note.tags && note.tags.length > 0
        ? note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
        : '<span class="no-data">无标签</span>';

    detailContainer.innerHTML = `
        <div class="note-detail-header">
            <span class="note-type-badge" style="background-color: ${typeConfig.color}">
                ${typeConfig.icon} ${typeConfig.name}
            </span>
            <span class="note-date">📅 ${formatDate(note.createdAt)}</span>
        </div>

        <h2 class="detail-title">${escapeHtml(note.title)}</h2>

        ${specificFields}

        <div class="detail-field">
            <label>📝 笔记内容</label>
            <div class="detail-content markdown-content">${renderMarkdown(note.content)}</div>
        </div>

        <div class="detail-field">
            <label>🏷️ 标签</label>
            <div class="note-tags">${tagsHtml}</div>
        </div>

        <div class="detail-meta">
            <small>创建于: ${new Date(note.date).toLocaleString('zh-CN')}</small>
            ${note.lastModified ? `<small>最后修改: ${new Date(note.lastModified).toLocaleString('zh-CN')}</small>` : ''}
        </div>
    `;
}

// ==================== 表单相关 ====================

/**
 * 显示添加笔记表单
 */
function showAddNoteForm() {
    appState.isEditMode = false;
    appState.currentNoteId = null;

    document.getElementById('formTitle').textContent = '新建笔记';
    document.getElementById('noteForm').reset();

    // 重置 Markdown 预览状态
    isPreviewMode = false;
    const preview = document.getElementById('markdownPreview');
    const previewBtn = document.getElementById('togglePreviewBtn');
    if (preview) preview.style.display = 'none';
    if (previewBtn) {
        previewBtn.classList.remove('active');
        previewBtn.innerHTML = '👁️ 预览';
    }

    // 设置默认日期为今天
    document.getElementById('noteDate').valueAsDate = new Date();

    // 根据当前筛选预选类型
    if (appState.currentFilter !== 'all') {
        const typeRadio = document.querySelector(`input[name="type"][value="${appState.currentFilter}"]`);
        if (typeRadio) {
            typeRadio.checked = true;
            showTypeSpecificFields(appState.currentFilter);
        }
    }

    switchView('form');
}

/**
 * 显示编辑笔记表单
 */
async function showEditNoteForm() {
    try {
        const note = await noteDB.getNoteById(appState.currentNoteId);
        if (!note) {
            showToast('笔记不存在', 'error');
            return;
        }

        appState.isEditMode = true;

        // 重置 Markdown 预览状态
        isPreviewMode = false;
        const preview = document.getElementById('markdownPreview');
        const previewBtn = document.getElementById('togglePreviewBtn');
        if (preview) preview.style.display = 'none';
        if (previewBtn) {
            previewBtn.classList.remove('active');
            previewBtn.innerHTML = '👁️ 预览';
        }

        document.getElementById('formTitle').textContent = '编辑笔记';

        // 填充表单
        document.querySelector(`input[name="type"][value="${note.type}"]`).checked = true;
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteDate').value = note.date;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteTags').value = note.tags ? note.tags.join(', ') : '';

        // 填充类型特定字段
        if (note.type === 'book') {
            document.getElementById('bookTitle').value = note.bookTitle || '';
            document.getElementById('author').value = note.author || '';
            document.getElementById('bookRating').value = note.rating || '';
        } else if (note.type === 'movie') {
            document.getElementById('movieTitle').value = note.movieTitle || '';
            document.getElementById('director').value = note.director || '';
            document.getElementById('actors').value = note.actors || '';
            document.getElementById('movieRating').value = note.rating || '';
        }

        showTypeSpecificFields(note.type);
        switchView('form');

    } catch (error) {
        console.error('加载编辑表单失败:', error);
        showToast('加载失败', 'error');
    }
}

/**
 * 显示/隐藏类型特定字段
 */
function showTypeSpecificFields(type) {
    // 隐藏所有类型特定字段
    document.querySelectorAll('.type-specific-fields').forEach(field => {
        field.style.display = 'none';
    });

    // 显示对应类型的字段
    const fieldsMap = {
        book: 'bookFields',
        movie: 'movieFields',
        daily: 'dailyFields'
    };

    const fieldsId = fieldsMap[type];
    if (fieldsId) {
        document.getElementById(fieldsId).style.display = 'block';
    }

    // 更新必填字段
    updateRequiredFields(type);
}

/**
 * 更新必填字段
 */
function updateRequiredFields(type) {
    // 清除所有类型特定字段的 required 属性
    document.querySelectorAll('.type-specific-fields input').forEach(input => {
        input.removeAttribute('required');
    });

    // 根据类型设置必填字段
    if (type === 'book') {
        document.getElementById('bookTitle').setAttribute('required', 'required');
    } else if (type === 'movie') {
        document.getElementById('movieTitle').setAttribute('required', 'required');
    }
}

/**
 * 保存笔记
 */
async function saveNote(event) {
    event.preventDefault();

    try {
        const formData = new FormData(event.target);
        const type = formData.get('type');

        // 构建笔记对象
        const note = {
            type: type,
            title: formData.get('title'),
            date: formData.get('date'),
            content: formData.get('content'),
            tags: formData.get('tags')
                ? formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag)
                : []
        };

        // 添加类型特定字段
        if (type === 'book') {
            note.bookTitle = document.getElementById('bookTitle').value || null;
            note.author = document.getElementById('author').value || null;
            note.rating = parseFloat(document.getElementById('bookRating').value) || null;
            note.itemTitle = note.bookTitle; // 复用字段
            note.subtitle = note.author;
        } else if (type === 'movie') {
            note.movieTitle = document.getElementById('movieTitle').value || null;
            note.director = document.getElementById('director').value || null;
            note.actors = document.getElementById('actors').value || null;
            note.rating = parseFloat(document.getElementById('movieRating').value) || null;
            note.itemTitle = note.movieTitle; // 复用字段
            note.subtitle = note.director;
        }

        // 保存或更新
        if (appState.isEditMode) {
            note.id = appState.currentNoteId;
            await noteDB.updateNote(note);
            showToast('笔记更新成功', 'success');
        } else {
            await noteDB.addNote(note);
            showToast('笔记添加成功', 'success');
        }

        // 返回列表
        switchView('list');
        await loadNotesList();

    } catch (error) {
        console.error('保存笔记失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

// ==================== 删除笔记相关 ====================

/**
 * 显示删除确认
 */
function showDeleteConfirm() {
    document.getElementById('confirmModal').style.display = 'flex';
}

/**
 * 隐藏删除确认
 */
function hideDeleteConfirm() {
    document.getElementById('confirmModal').style.display = 'none';
}

/**
 * 删除笔记
 */
async function deleteNote() {
    try {
        await noteDB.deleteNote(appState.currentNoteId);
        showToast('笔记已删除', 'success');
        hideDeleteConfirm();
        switchView('list');
        await loadNotesList();

    } catch (error) {
        console.error('删除笔记失败:', error);
        showToast('删除失败', 'error');
    }
}

// ==================== 导出/导入相关 ====================

// ==================== 导出功能 ====================

/**
 * 显示导出页面
 */
async function showExportView() {
    appState.selectedExportNotes.clear();
    await loadExportNotesList();
    switchView('export');
}

/**
 * 加载导出笔记列表
 */
async function loadExportNotesList() {
    try {
        const filterType = document.getElementById('exportTypeFilter').value;
        let notes;

        if (filterType === 'all') {
            notes = await noteDB.getAllNotes();
        } else {
            notes = await noteDB.getNotesByType(filterType);
        }

        notes = sortNotes(notes, 'date-desc');
        renderExportNotesList(notes);
        updateSelectedCount();

    } catch (error) {
        console.error('加载导出列表失败:', error);
        showToast('加载失败', 'error');
    }
}

/**
 * 渲染导出笔记列表
 */
function renderExportNotesList(notes) {
    const container = document.getElementById('exportNotesList');

    if (notes.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 2rem;"><p>没有可导出的笔记</p></div>';
        return;
    }

    container.innerHTML = notes.map(note => {
        const typeConfig = NOTE_TYPES[note.type];
        const isChecked = appState.selectedExportNotes.has(note.id) ? 'checked' : '';

        return `
            <div class="export-note-item">
                <input type="checkbox"
                       id="export-${note.id}"
                       data-id="${note.id}"
                       ${isChecked}
                       onchange="toggleExportNote('${note.id}')">
                <div class="export-note-info">
                    <div class="export-note-title">${escapeHtml(note.title)}</div>
                    <div class="export-note-meta">
                        ${typeConfig.icon} ${typeConfig.name} · ${formatDate(note.createdAt)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 切换选中状态
 */
function toggleExportNote(noteId) {
    if (appState.selectedExportNotes.has(noteId)) {
        appState.selectedExportNotes.delete(noteId);
    } else {
        appState.selectedExportNotes.add(noteId);
    }
    updateSelectedCount();
}

/**
 * 全选
 */
function selectAllExportNotes() {
    document.querySelectorAll('#exportNotesList input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        appState.selectedExportNotes.add(cb.dataset.id);
    });
    updateSelectedCount();
}

/**
 * 取消全选
 */
function deselectAllExportNotes() {
    document.querySelectorAll('#exportNotesList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    appState.selectedExportNotes.clear();
    updateSelectedCount();
}

/**
 * 更新选中数量
 */
function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = appState.selectedExportNotes.size;
}

/**
 * 确认导出
 */
async function confirmExport() {
    if (appState.selectedExportNotes.size === 0) {
        showToast('请至少选择一条笔记', 'error');
        return;
    }

    try {
        const allNotes = await noteDB.getAllNotes();
        const selectedNotes = allNotes.filter(note => appState.selectedExportNotes.has(note.id));

        const dataStr = JSON.stringify(selectedNotes, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        showToast(`已导出 ${selectedNotes.length} 条笔记`, 'success');
        switchView('list');

    } catch (error) {
        console.error('导出失败:', error);
        showToast('导出失败', 'error');
    }
}

// ==================== 导入功能 ====================

/**
 * 显示导入页面
 */
function showImportView() {
    appState.importData = null;
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('selectedFileInfo').style.display = 'none';
    document.getElementById('confirmImportBtn').disabled = true;
    document.querySelector('input[name="importType"][value="keep"]').checked = true;
    document.getElementById('replaceExisting').checked = false;
    switchView('import');
}

/**
 * 处理文件选择
 */
async function handleImportFile(file) {
    try {
        const text = await file.text();
        const notes = JSON.parse(text);

        if (!Array.isArray(notes)) {
            throw new Error('文件格式不正确，必须是笔记数组');
        }

        appState.importData = notes;

        // 显示文件信息
        document.getElementById('selectedFileName').textContent = file.name;
        document.getElementById('selectedFileInfo').style.display = 'flex';

        // 显示预览
        document.getElementById('previewCount').textContent = notes.length;
        const previewList = document.getElementById('previewList');
        previewList.innerHTML = notes.slice(0, 5).map(note => {
            const typeConfig = NOTE_TYPES[note.type] || NOTE_TYPES.daily;
            return `<div class="preview-item">${typeConfig.icon} ${escapeHtml(note.title || '无标题')}</div>`;
        }).join('');

        if (notes.length > 5) {
            previewList.innerHTML += `<div class="preview-item" style="color: var(--text-muted);">... 还有 ${notes.length - 5} 条</div>`;
        }

        document.getElementById('importPreview').style.display = 'block';
        document.getElementById('confirmImportBtn').disabled = false;

    } catch (error) {
        console.error('文件解析失败:', error);
        showToast('文件解析失败: ' + error.message, 'error');
        appState.importData = null;
    }
}

/**
 * 清除选择的文件
 */
function clearImportFile() {
    appState.importData = null;
    document.getElementById('importFileInput2').value = '';
    document.getElementById('selectedFileInfo').style.display = 'none';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('confirmImportBtn').disabled = true;
}

/**
 * 确认导入
 */
async function confirmImport() {
    if (!appState.importData || appState.importData.length === 0) {
        showToast('没有可导入的数据', 'error');
        return;
    }

    try {
        const importType = document.querySelector('input[name="importType"]:checked').value;
        const replaceExisting = document.getElementById('replaceExisting').checked;

        // 处理导入数据
        let notesToImport = appState.importData.map(note => {
            // 创建笔记副本，避免修改原始数据
            let newNote = { ...note };

            // 如果选择了特定类型，修改所有笔记的类型
            if (importType !== 'keep') {
                newNote.type = importType;
            }

            // 确保有必要的字段
            if (!newNote.title) newNote.title = '未命名笔记';
            if (!newNote.content) newNote.content = '';
            if (!newNote.date) newNote.date = new Date().toISOString().split('T')[0];
            if (!newNote.type) newNote.type = 'daily';

            // 如果是追加模式，生成新的 ID 避免覆盖原有笔记
            if (!replaceExisting) {
                newNote.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            }

            return newNote;
        });

        // 如果替换现有数据
        if (replaceExisting) {
            await noteDB.clearAll();
        }

        // 导入数据
        await noteDB.importNotes(notesToImport);

        showToast(`成功导入 ${notesToImport.length} 条笔记`, 'success');
        switchView('list');
        await loadNotesList();

    } catch (error) {
        console.error('导入失败:', error);
        showToast('导入失败: ' + error.message, 'error');
    }
}

// ==================== 事件监听器 ====================

/**
 * 初始化应用
 */
async function initApp() {
    try {
        // 显示当前用户
        const user = noteAPI.getCurrentUser();
        if (user) {
            document.getElementById('currentUser').textContent = `👤 ${user.username}`;
        }

        // 加载笔记列表
        await loadNotesList();

        // 绑定事件监听器
        bindEventListeners();

        // 检查每日计划提醒
        await checkDailyPlanAlert();

        console.log('✅ 应用初始化完成');

    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
        showToast('应用初始化失败', 'error');
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initApp);

/**
 * 绑定所有事件监听器
 */
function bindEventListeners() {
    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            appState.currentFilter = this.dataset.type;
            // 切换到列表视图
            switchView('list');
            loadNotesList();
        });
    });

    // 新建笔记按钮
    document.getElementById('addNoteBtn').addEventListener('click', showAddNoteForm);

    // 搜索
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        appState.searchKeyword = e.target.value;
        loadNotesList();
    });

    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        searchInput.value = '';
        appState.searchKeyword = '';
        loadNotesList();
    });

    // 排序
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        appState.sortBy = e.target.value;
        loadNotesList();
    });

    // 详情页按钮
    document.getElementById('backToListBtn').addEventListener('click', () => {
        switchView('list');
    });

    document.getElementById('editNoteBtn').addEventListener('click', showEditNoteForm);
    document.getElementById('deleteNoteBtn').addEventListener('click', showDeleteConfirm);

    // 表单
    document.getElementById('noteForm').addEventListener('submit', saveNote);

    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            showTypeSpecificFields(e.target.value);
        });
    });

    document.getElementById('cancelFormBtn').addEventListener('click', () => {
        switchView(appState.isEditMode ? 'detail' : 'list');
    });

    document.getElementById('cancelFormBtn2').addEventListener('click', () => {
        switchView(appState.isEditMode ? 'detail' : 'list');
    });

    // 删除确认
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteNote);
    document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteConfirm);

    // 导出功能
    document.getElementById('exportBtn').addEventListener('click', showExportView);
    document.getElementById('cancelExportBtn').addEventListener('click', () => switchView('list'));
    document.getElementById('cancelExportBtn2').addEventListener('click', () => switchView('list'));
    document.getElementById('selectAllBtn').addEventListener('click', selectAllExportNotes);
    document.getElementById('deselectAllBtn').addEventListener('click', deselectAllExportNotes);
    document.getElementById('confirmExportBtn').addEventListener('click', confirmExport);
    document.getElementById('exportTypeFilter').addEventListener('change', loadExportNotesList);

    // 导入功能
    document.getElementById('importBtn').addEventListener('click', showImportView);
    document.getElementById('cancelImportBtn').addEventListener('click', () => switchView('list'));
    document.getElementById('cancelImportBtn2').addEventListener('click', () => switchView('list'));
    document.getElementById('confirmImportBtn').addEventListener('click', confirmImport);
    document.getElementById('clearFileBtn').addEventListener('click', clearImportFile);

    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // 文件上传区域
    const fileUploadArea = document.getElementById('fileUploadArea');
    const importFileInput2 = document.getElementById('importFileInput2');

    fileUploadArea.addEventListener('click', () => {
        importFileInput2.click();
    });

    importFileInput2.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImportFile(file);
        }
    });

    // 拖放支持
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.json')) {
            handleImportFile(file);
        } else {
            showToast('请选择 .json 文件', 'error');
        }
    });

    // 每日计划
    document.getElementById('dailyPlanBtn').addEventListener('click', showDailyPlanView);
    document.getElementById('backFromPlanBtn').addEventListener('click', () => switchView('list'));
    document.getElementById('addTaskBtn').addEventListener('click', addNewTask);

    // 回车添加任务
    document.getElementById('newTaskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewTask();
        }
    });

    // 历史计划
    document.getElementById('historyPlanBtn').addEventListener('click', showHistoryPlanView);
    document.getElementById('backFromHistoryBtn').addEventListener('click', () => switchView('list'));
    document.getElementById('prevMonthBtn').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonthBtn').addEventListener('click', () => navigateMonth(1));
    document.getElementById('deleteHistoryPlanBtn').addEventListener('click', deleteSelectedDatePlan);

    // 历史计划导出导入
    document.getElementById('exportPlansBtn').addEventListener('click', exportAllPlans);
    document.getElementById('importPlansBtn').addEventListener('click', () => {
        document.getElementById('planFileInput').click();
    });
    document.getElementById('planFileInput').addEventListener('change', handlePlanImport);
}

// ==================== 每日计划相关 ====================

/**
 * 获取今天的日期字符串
 */
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * 检查今天是否是工作日
 */
function isWorkday() {
    const day = new Date().getDay();
    return day !== 0 && day !== 6; // 0 是周日，6 是周六
}

/**
 * 检查并显示每日计划提醒
 */
async function checkDailyPlanAlert() {
    const alertEl = document.getElementById('dailyPlanAlert');

    // 只在工作日显示提醒
    if (!isWorkday()) {
        alertEl.style.display = 'none';
        return;
    }

    try {
        const today = getTodayString();
        const hasPlan = await noteDB.hasPlanForDate(today);

        if (!hasPlan) {
            alertEl.style.display = 'flex';
        } else {
            alertEl.style.display = 'none';
        }
    } catch (error) {
        console.error('检查每日计划失败:', error);
        alertEl.style.display = 'none';
    }
}

/**
 * 显示每日计划视图
 */
async function showDailyPlanView() {
    // 清除所有筛选按钮的高亮状态
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

    const today = getTodayString();
    const date = new Date(today);

    // 显示日期
    const dateDisplay = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    document.getElementById('planDateDisplay').textContent = dateDisplay;

    // 加载任务列表
    await loadTaskList(today);

    switchView('dailyPlan');
}

/**
 * 加载任务列表
 */
async function loadTaskList(date) {
    try {
        const tasks = await noteDB.getPlanByDate(date);
        renderTaskList(tasks);
        updatePlanStats(tasks);
    } catch (error) {
        console.error('加载任务列表失败:', error);
        showToast('加载任务失败', 'error');
    }
}

/**
 * 渲染任务列表
 */
function renderTaskList(tasks) {
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyTaskState');

    if (tasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    // 按创建时间排序
    tasks.sort((a, b) => a.createdAt - b.createdAt);

    taskList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <input type="checkbox"
                   class="task-checkbox"
                   ${task.completed ? 'checked' : ''}
                   onchange="toggleTaskComplete('${task.id}', this.checked)">
            <span class="task-text">${escapeHtml(task.task)}</span>
            <button class="task-delete" onclick="deleteTask('${task.id}')" title="删除任务">
                🗑️
            </button>
        </div>
    `).join('');
}

/**
 * 更新计划统计
 */
function updatePlanStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('progressFill').style.width = `${percentage}%`;
}

/**
 * 添加新任务
 */
async function addNewTask() {
    const input = document.getElementById('newTaskInput');
    const text = input.value.trim();

    if (!text) {
        showToast('请输入任务内容', 'error');
        return;
    }

    try {
        const task = {
            task: text,
            date: getTodayString(),
            completed: false
        };

        await noteDB.addTask(task);
        input.value = '';

        // 刷新列表
        await loadTaskList(getTodayString());

        // 更新提醒状态
        await checkDailyPlanAlert();

        showToast('任务添加成功', 'success');
    } catch (error) {
        console.error('添加任务失败:', error);
        showToast('添加任务失败', 'error');
    }
}

/**
 * 切换任务完成状态
 */
async function toggleTaskComplete(taskId, completed) {
    try {
        const today = getTodayString();
        const tasks = await noteDB.getPlanByDate(today);
        const task = tasks.find(t => t.id === taskId);

        if (task) {
            task.completed = completed;
            await noteDB.updateTask(task);
            await loadTaskList(today);
        }
    } catch (error) {
        console.error('更新任务状态失败:', error);
        showToast('更新失败', 'error');
    }
}

/**
 * 删除任务
 */
async function deleteTask(taskId) {
    try {
        await noteDB.deleteTask(taskId);
        await loadTaskList(getTodayString());

        // 更新提醒状态
        await checkDailyPlanAlert();

        showToast('任务已删除', 'success');
    } catch (error) {
        console.error('删除任务失败:', error);
        showToast('删除失败', 'error');
    }
}

// ==================== 历史计划相关 ====================

// 当前查看的月份
let currentViewMonth = new Date();
let selectedHistoryDate = null;

/**
 * 显示历史计划视图
 */
async function showHistoryPlanView() {
    // 清除所有筛选按钮的高亮状态
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

    currentViewMonth = new Date();
    selectedHistoryDate = null;

    await loadHistoryStats();

    // 检查今天是否有计划，如果有则自动选中
    const today = getTodayString();
    const hasTodayPlan = await noteDB.hasPlanForDate(today);
    if (hasTodayPlan) {
        selectedHistoryDate = today;
    }

    await renderCalendar();

    switchView('historyPlan');
}

/**
 * 加载历史统计数据
 */
async function loadHistoryStats() {
    try {
        const allTasks = await noteDB.getAllPlans();

        // 按日期分组
        const dateMap = new Map();
        allTasks.forEach(task => {
            if (!dateMap.has(task.date)) {
                dateMap.set(task.date, []);
            }
            dateMap.get(task.date).push(task);
        });

        const totalDays = dateMap.size;
        const totalTasks = allTasks.length;
        const totalCompleted = allTasks.filter(t => t.completed).length;
        const avgRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

        document.getElementById('totalDaysCount').textContent = totalDays;
        document.getElementById('totalTasksCount').textContent = totalTasks;
        document.getElementById('totalCompletedCount').textContent = totalCompleted;
        document.getElementById('avgCompletionRate').textContent = `${avgRate}%`;
    } catch (error) {
        console.error('加载历史统计失败:', error);
    }
}

/**
 * 渲染日历
 */
async function renderCalendar() {
    const year = currentViewMonth.getFullYear();
    const month = currentViewMonth.getMonth();

    // 更新月份显示
    const monthName = currentViewMonth.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long'
    });
    document.getElementById('currentMonthDisplay').textContent = monthName;

    // 获取该月所有计划日期
    const allTasks = await noteDB.getAllPlans();
    const datesWithPlan = new Set();
    allTasks.forEach(task => {
        const taskDate = new Date(task.date);
        if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
            datesWithPlan.add(task.date);
        }
    });

    // 获取该月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    // 今天
    const today = getTodayString();

    // 渲染日历
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // 填充空白天
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        dayEl.dataset.date = dateStr;

        // 标记今天
        if (dateStr === today) {
            dayEl.classList.add('today');
        }

        // 标记有计划的日期
        if (datesWithPlan.has(dateStr)) {
            dayEl.classList.add('has-plan');
        }

        // 标记未来日期为禁用
        if (new Date(dateStr) > new Date(today)) {
            dayEl.classList.add('disabled');
        } else {
            dayEl.addEventListener('click', () => selectDate(dateStr));
        }

        // 标记选中日期
        if (dateStr === selectedHistoryDate) {
            dayEl.classList.add('selected');
        }

        calendarDays.appendChild(dayEl);
    }

    // 如果有选中日期，显示详情
    if (selectedHistoryDate) {
        await showSelectedDateDetails(selectedHistoryDate);
    } else {
        document.getElementById('selectedDatePlan').style.display = 'none';
        document.getElementById('historyEmptyState').style.display = 'flex';
    }
}

/**
 * 选择日期
 */
async function selectDate(dateStr) {
    selectedHistoryDate = dateStr;
    await renderCalendar();
}

/**
 * 显示选中日期的详情
 */
async function showSelectedDateDetails(dateStr) {
    try {
        const tasks = await noteDB.getPlanByDate(dateStr);

        if (tasks.length === 0) {
            document.getElementById('selectedDatePlan').style.display = 'none';
            document.getElementById('historyEmptyState').style.display = 'flex';
            return;
        }

        // 隐藏空状态，显示详情
        document.getElementById('historyEmptyState').style.display = 'none';
        document.getElementById('selectedDatePlan').style.display = 'flex';

        // 显示日期
        const date = new Date(dateStr);
        const dateDisplay = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        document.getElementById('selectedDateTitle').textContent = dateDisplay;

        // 渲染任务列表（只读模式）
        tasks.sort((a, b) => a.createdAt - b.createdAt);
        const taskList = document.getElementById('selectedDateTaskList');
        taskList.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox"
                       class="task-checkbox"
                       ${task.completed ? 'checked' : ''}
                       disabled>
                <span class="task-text">${escapeHtml(task.task)}</span>
            </div>
        `).join('');

        // 更新统计
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('selectedCompletedCount').textContent = completed;
        document.getElementById('selectedTotalCount').textContent = total;
        document.getElementById('selectedProgressFill').style.width = `${percentage}%`;
    } catch (error) {
        console.error('加载日期详情失败:', error);
        showToast('加载失败', 'error');
    }
}

/**
 * 切换月份
 */
async function navigateMonth(offset) {
    currentViewMonth = new Date(
        currentViewMonth.getFullYear(),
        currentViewMonth.getMonth() + offset,
        1
    );
    selectedHistoryDate = null;
    await renderCalendar();
}

/**
 * 删除选中日期的计划
 */
async function deleteSelectedDatePlan() {
    if (!selectedHistoryDate) {
        return;
    }

    if (!confirm(`确定要删除 ${selectedHistoryDate} 的所有计划吗？`)) {
        return;
    }

    try {
        await noteDB.deletePlanByDate(selectedHistoryDate);
        selectedHistoryDate = null;

        // 刷新视图
        await loadHistoryStats();
        await renderCalendar();
        await checkDailyPlanAlert();

        showToast('计划已删除', 'success');
    } catch (error) {
        console.error('删除计划失败:', error);
        showToast('删除失败', 'error');
    }
}

/**
 * 导出所有历史计划
 */
async function exportAllPlans() {
    try {
        const allPlans = await noteDB.getAllPlans();

        if (allPlans.length === 0) {
            showToast('没有可导出的计划', 'error');
            return;
        }

        // 创建导出数据
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalPlans: allPlans.length,
            plans: allPlans
        };

        // 转换为 JSON
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `历史计划_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`成功导出 ${allPlans.length} 条计划`, 'success');
    } catch (error) {
        console.error('导出计划失败:', error);
        showToast('导出失败', 'error');
    }
}

/**
 * 导入历史计划
 */
async function handlePlanImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 重置文件输入，以便可以重复导入同一个文件
    event.target.value = '';

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // 验证数据格式
        if (!data.plans || !Array.isArray(data.plans)) {
            showToast('文件格式错误', 'error');
            return;
        }

        if (data.plans.length === 0) {
            showToast('文件中没有计划数据', 'error');
            return;
        }

        // 询问导入方式
        const confirmMsg = `检测到 ${data.plans.length} 条计划记录\n\n` +
                          `导出日期: ${data.exportDate ? new Date(data.exportDate).toLocaleString('zh-CN') : '未知'}\n\n` +
                          `点击"确定"导入（已存在的计划将被覆盖）\n` +
                          `点击"取消"放弃导入`;

        if (!confirm(confirmMsg)) {
            return;
        }

        // 逐条导入
        let successCount = 0;
        let failCount = 0;

        for (const plan of data.plans) {
            try {
                // 检查计划是否已存在
                const existingPlan = await noteDB.getPlanByDate(plan.date);
                const exists = existingPlan.some(p => p.id === plan.id);

                if (exists) {
                    // 更新已存在的计划
                    await noteDB.updateTask(plan);
                } else {
                    // 添加新计划
                    await noteDB.addTask(plan);
                }
                successCount++;
            } catch (error) {
                console.error('导入单条计划失败:', plan, error);
                failCount++;
            }
        }

        // 刷新视图
        await loadHistoryStats();
        await renderCalendar();
        await checkDailyPlanAlert();

        // 显示导入结果
        if (failCount === 0) {
            showToast(`成功导入 ${successCount} 条计划`, 'success');
        } else {
            showToast(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条`, 'error');
        }
    } catch (error) {
        console.error('导入计划失败:', error);
        if (error instanceof SyntaxError) {
            showToast('文件格式错误，请确保是有效的 JSON 文件', 'error');
        } else {
            showToast('导入失败', 'error');
        }
    }
}

// 暴露到全局作用域（用于 HTML onclick）
window.viewNoteDetail = viewNoteDetail;
window.toggleExportNote = toggleExportNote;
window.toggleTaskComplete = toggleTaskComplete;
window.deleteTask = deleteTask;
