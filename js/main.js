const API_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = 'PASTE_YOUR_API_KEY_HERE';

function loadCourses() {
    const url = `${API_URL}/api/courses?api_key=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            renderCourses(data);
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
