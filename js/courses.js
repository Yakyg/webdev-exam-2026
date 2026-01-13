let courses = [];
let page = 1;
const PER_PAGE = 5;

fetch(`${API_URL}/api/courses?api_key=${API_KEY}`)
    .then(r => r.json())
    .then(data => {
        courses = data;
        render();
    })
    .catch(() => showNotification('Ошибка загрузки курсов', 'danger'));

function render() {
    const container = document.getElementById('courses');
    container.innerHTML = '';

    courses.slice((page - 1) * PER_PAGE, page * PER_PAGE)
        .forEach(course => {
            container.innerHTML += `
            <div class="col-md-4 mb-3">
                <div class="card h-100 p-3">
                    <h5>${course.name}</h5>
                    <p>${course.description}</p>
                    <p class="text-muted">${course.teacher}</p>
                    <button class="btn btn-primary">Подать заявку</button>
                </div>
            </div>`;
        });
}
