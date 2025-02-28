document.addEventListener("submit", async function(event) {
    if (event.target && event.target.id === "configForm") {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const server = window.location.hostname === "" ? "localhost" : window.location.hostname;
            const response = await fetch("http://" + server + ":3000/save-config", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert("Config saved successfully!");
            } else {
                alert("Error saving config");
            }
        } catch (error) {
            console.error("Request failed", error);
            alert("Request failed");
        }
    }
});