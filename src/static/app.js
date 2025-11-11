document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML
          const participants = details.participants || [];

          // Build card content
          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

          // Participants section (built with DOM so we can attach handlers)
          const participantsSection = document.createElement("div");
          participantsSection.className = "participants-section";
          const participantsTitle = document.createElement("p");
          participantsTitle.innerHTML = "<strong>Participants:</strong>";
          participantsSection.appendChild(participantsTitle);

          if (participants.length) {
            const ul = document.createElement("ul");
            ul.className = "participants-list";

            participants.forEach((p) => {
              const li = document.createElement("li");
              li.className = "participant-item";

              const span = document.createElement("span");
              span.textContent = p;

              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "delete-btn";
              btn.title = "Unregister participant";
              btn.innerHTML = "&times;";
              btn.dataset.activity = name;
              btn.dataset.email = p;

              // Attach click handler to unregister this participant
              btn.addEventListener("click", async (e) => {
                e.stopPropagation();
                await unregisterParticipant(name, p);
              });

              li.appendChild(span);
              li.appendChild(btn);
              ul.appendChild(li);
            });

            participantsSection.appendChild(ul);
          } else {
            const pNo = document.createElement("p");
            pNo.className = "no-participants";
            pNo.textContent = "No participants yet";
            participantsSection.appendChild(pNo);
          }

          activityCard.appendChild(participantsSection);
          activitiesList.appendChild(activityCard);

          // Add option to select dropdown
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        // show success styling
        messageDiv.classList.remove("error");
        messageDiv.classList.add("message", "success");
        signupForm.reset();

        // Refresh activities so the new participant appears immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.classList.remove("success");
        messageDiv.classList.add("message", "error");
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds and clear message classes
      setTimeout(() => {
        messageDiv.classList.add("hidden");
        messageDiv.classList.remove("message", "success", "error");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Unregister a participant from an activity
  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        // Refresh activities to reflect change
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 4000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Initialize app
  fetchActivities();
});
