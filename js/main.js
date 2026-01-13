let allCourses = [];
let currentPage = 1;
const COURSES_PER_PAGE = 5;





const API_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = '7f66c6a6-569e-4bb3-945b-b82b7a90c9ac';

function loadCourses() {
    const url = `${API_URL}/api/courses?api_key=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            allCourses = data;
            currentPage = 1;
            renderCoursesPage();
            renderCoursesPagination();
        })
        .catch(error => {
            showNotification('Ошибка загрузки курсов', 'danger');
            console.error(error);
        });
}

function renderCourses(courses) {
    const coursesContainer = document.getElementById('courses');
    coursesContainer.innerHTML = '';

    courses.forEach(course => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';

        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${course.name}</h5>
                    <p class="card-text">
                        ${course.description}
                    </p>
                    <p class="text-muted mb-1">
                        Преподаватель: ${course.teacher}
                    </p>
                    <p class="text-muted mb-1">
                        Уровень: ${course.level}
                    </p>
                    <button class="btn btn-primary w-100" disabled>
                        Подать заявку
                    </button>
                </div>
            </div>
        `;
        coursesContainer.appendChild(col);
    });
}

function renderCoursesPage() {
    const start = (currentPage - 1) * COURSES_PER_PAGE;
    const end = start + COURSES_PER_PAGE;

    const pageCourses = allCourses.slice(start, end);
    renderCourses(pageCourses);
}

function renderCoursesPagination() {
    const totalPages = Math.ceil(allCourses.length / COURSES_PER_PAGE);

    let pagination = document.getElementById('courses-pagination');
    if (!pagination) {
        pagination = document.createElement('nav');
        pagination.id = 'courses-pagination';
        pagination.className = 'mt-4';

        document.querySelector('.container').appendChild(pagination);
    }

    let html = '<ul class="pagination justify-content-center">';

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="changeCoursesPage(${i})">
                    ${i}
                </button>
            </li>
        `;
    }

    html += '</ul>';
    pagination.innerHTML = html;
}

function changeCoursesPage(page) {
    currentPage = page;
    renderCoursesPage();
    renderCoursesPagination();
}

function showNotification(message, type) {
    const container = document.getElementById('notifications');

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
});
