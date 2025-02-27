// Fetch data from the backend based on the selected tab
async function fetchData(tab) {
    try {
        const server = window.location.hostname === "" ? "localhost" : window.location.hostname;
        const response = await fetch("http://" + server + `:3000/data/${tab}`);
        const htmlContent = await response.text();
        if (htmlContent) {
            document.getElementById('tabContent').innerHTML = htmlContent;
        } else {
            document.getElementById('tabContent').innerHTML = 'Error loading data.';
        }
    } catch (error) {
        document.getElementById('tabContent').innerHTML = 'Failed to fetch data.';
    }
}

// Handle tab click event
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const selectedTab = tab.getAttribute('data-tab');
        fetchData(selectedTab);
    });
});

// Initial load of the first tab data
fetchData('thermostat');

