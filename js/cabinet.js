import { getOrders, updateOrder, deleteOrder, getCourses, getTutors } from './api.js';

let allOrders = [];
let allCourses = [];
let allTutors = [];
let currentOrderId = null;
let currentOrderData = null;
let coursesMap = new Map();
let tutorsMap  = new Map();

// Показ уведомления 
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast notification bg-${type} text-white`;
    toast.innerHTML = `<div class="toast-body">${message}</div>`;
    document.body.appendChild(toast);
    new bootstrap.Toast(toast, { autohide: true, delay: 5000 }).show();
    setTimeout(() => toast.remove(), 6000);
}

// Рендер списка заявок
function renderOrders(page = 1) {
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = '';

    const perPage = 5;
    const start = (page - 1) * perPage;
    const pageOrders = allOrders.slice(start, start + perPage);

    pageOrders.forEach((order, idx) => {
        const globalIndex = start + idx + 1;

        // Определяем отображаемое название
        let displayName = '—';
        let typeText = '—';

        if (order.course_id && order.course_id !== 0) {
            const course = coursesMap.get(Number(order.course_id));
            displayName = course ? course.name : `Курс #${order.course_id}`;
            typeText = 'Курс';
        } 
        else if (order.tutor_id && order.tutor_id !== 0) {
            const tutor = tutorsMap.get(Number(order.tutor_id));
            displayName = tutor ? tutor.name : `Репетитор #${order.tutor_id}`;
            typeText = 'Репетитор';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${globalIndex}</td>
            <td>
                <strong>${displayName}</strong><br>
                <small class="text-muted">${typeText}</small>
            </td>
            <td>${order.date_start || '—'}</td>
            <td>${order.time_start || '—'}</td>
            <td>${order.price ? order.price.toLocaleString('ru-RU') + ' ₽' : '—'}</td>
            <td><span class="badge bg-secondary">Активна</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info" onclick="viewOrder(${order.id})">Подробнее</button>
                    <button class="btn btn-outline-warning" onclick="editOrder(${order.id})">Изменить</button>
                    <button class="btn btn-outline-danger" onclick="confirmDelete(${order.id})">Удалить</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination(page);
}

function renderPagination(currentPage) {
    const totalPages = Math.ceil(allOrders.length / 5);
    let html = `<ul class="pagination justify-content-center">`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="renderOrders(${i}); return false;">${i}</a>
                 </li>`;
    }
    html += `</ul>`;
    document.getElementById('ordersPagination').innerHTML = html;
}

// Просмотр заявки
window.viewOrder = function(id) {
    const order = allOrders.find(o => o.id === id);
    if (!order) return;

    let displayName = '—';
    if (order.course_id && order.course_id !== 0) {
        const course = coursesMap.get(Number(order.course_id));
        displayName = course ? course.name : `Курс #${order.course_id}`;
    } else if (order.tutor_id && order.tutor_id !== 0) {
        const tutor = tutorsMap.get(Number(order.tutor_id));
        displayName = tutor ? tutor.name : `Репетитор #${order.tutor_id}`;
    }

    const body = document.getElementById('viewOrderBody');
    body.innerHTML = `
        <dl class="row">
            <dt class="col-sm-4">ID заявки</dt><dd class="col-sm-8">${order.id}</dd>
            <dt class="col-sm-4">Тип</dt><dd class="col-sm-8">${order.course_id ? 'Курс' : 'Индивидуально с репетитором'}</dd>
            <dt class="col-sm-4">Название</dt><dd class="col-sm-8 fw-bold">${displayName}</dd>
            <dt class="col-sm-4">Дата начала</dt><dd class="col-sm-8">${order.date_start || '—'}</dd>
            <dt class="col-sm-4">Время начала</dt><dd class="col-sm-8">${order.time_start || '—'}</dd>
            <dt class="col-sm-4">Продолжительность</dt><dd class="col-sm-8">${order.duration || '—'} ч</dd>
            <dt class="col-sm-4">Количество человек</dt><dd class="col-sm-8">${order.persons || 1}</dd>
            <dt class="col-sm-4">Стоимость</dt><dd class="col-sm-8 fw-bold">${order.price ? order.price.toLocaleString('ru-RU') + ' ₽' : '—'}</dd>
        </dl>

        <h6 class="mt-4">Дополнительные опции:</h6>
        <ul>
            ${order.early_registration   ? '<li>Скидка за раннюю регистрацию</li>' : ''}
            ${order.group_enrollment     ? '<li>Групповая скидка</li>' : ''}
            ${order.intensive_course     ? '<li>Интенсивный курс</li>' : ''}
            ${order.supplementary        ? '<li>Доп. материалы</li>' : ''}
            ${order.personalized         ? '<li>Персонализация</li>' : ''}
            ${order.excursions           ? '<li>Экскурсии</li>' : ''}
            ${order.assessment           ? '<li>Оценка уровня</li>' : ''}
            ${order.interactive          ? '<li>Интерактивная платформа</li>' : ''}
            ${!order.early_registration && !order.group_enrollment && !order.intensive_course &&
              !order.supplementary && !order.personalized && !order.excursions &&
              !order.assessment && !order.interactive ? '<li>Нет</li>' : ''}
        </ul>
    `;

    new bootstrap.Modal(document.getElementById('viewOrderModal')).show();
};

// Редактирование заявки 
window.editOrder = function(id) {
    currentOrderId = id;
    currentOrderData = allOrders.find(o => o.id === id);
    if (!currentOrderData) return;

    const body = document.getElementById('editOrderBody');
    body.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Дата начала</label>
            <input type="date" id="editDate" class="form-control" value="${currentOrderData.date_start || ''}">
        </div>
        <div class="mb-3">
            <label class="form-label">Время начала</label>
            <input type="time" id="editTime" class="form-control" value="${currentOrderData.time_start || ''}">
        </div>
        <div class="mb-3">
            <label class="form-label">Продолжительность (часов)</label>
            <input type="number" id="editDuration" class="form-control" min="1" max="40" value="${currentOrderData.duration || 1}">
        </div>
        <div class="mb-3">
            <label class="form-label">Количество человек</label>
            <input type="number" id="editPersons" class="form-control" min="1" max="20" value="${currentOrderData.persons || 1}">
        </div>
        <div class="mb-3">
            <label class="form-label">Стоимость (₽)</label>
            <input type="number" id="editPrice" class="form-control" value="${currentOrderData.price || 0}">
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('editOrderModal'));
    modal.show();

    document.getElementById('saveEditBtn').onclick = async () => {
        const updated = {
            date_start: document.getElementById('editDate').value,
            time_start: document.getElementById('editTime').value,
            duration:   parseInt(document.getElementById('editDuration').value),
            persons:    parseInt(document.getElementById('editPersons').value),
            price:      parseInt(document.getElementById('editPrice').value)
        };

        try {
            await updateOrder(currentOrderId, updated);
            showToast('Заявка обновлена', 'success');
            modal.hide();
            await loadData();
        } catch (err) {
            showToast('Не удалось сохранить изменения', 'danger');
        }
    };
};

// Подтверждение удаления
window.confirmDelete = function(id) {
    currentOrderId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();

    document.getElementById('confirmDeleteBtn').onclick = async () => {
        try {
            await deleteOrder(id);
            showToast('Заявка удалена', 'success');
            modal.hide();
            await loadData();
        } catch (err) {
            showToast('Не удалось удалить заявку', 'danger');
        }
    };
};

async function loadData() {
    try {
        const [orders, courses, tutors] = await Promise.all([
            getOrders(),
            getCourses(),
            getTutors()
        ]);

        allOrders = orders;
        allCourses = courses;
        allTutors = tutors;

        courses.forEach(c => coursesMap.set(c.id, c));
        tutors.forEach(t => tutorsMap.set(t.id, t));

        renderOrders(1);
    } catch (err) {
        showToast('Ошибка загрузки данных: ' + (err.error || err.message || 'неизвестно'), 'danger');
        console.error(err);
    }
}
loadData();