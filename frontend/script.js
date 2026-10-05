// ================================
// CONFIGURATION
// ================================

const API_BASE_URL = "http://127.0.0.1:5000";


// ================================
// LOGIN / PROFILE NAVIGATION
// ================================

const authNavButton =
    document.getElementById("authNavButton");

if (authNavButton) {

    let currentUser = null;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("currentUser")
        );
    } catch (error) {
        localStorage.removeItem("currentUser");
    }

    if (currentUser) {
        authNavButton.textContent = "Profile";
        authNavButton.href = "dashboard.html";
    } else {
        authNavButton.textContent = "Login";
        authNavButton.href = "login.html";
    }
}


// ================================
// REPORT INCIDENT
// ================================

const reportForm =
    document.getElementById("reportForm");

const reportMessage =
    document.getElementById("reportMessage");

if (reportForm) {

    reportForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const category =
                document.getElementById("category").value.trim();

            const description =
                document.getElementById("description").value.trim();

            const additional =
                document.getElementById("additional").value.trim();

            let currentUser = null;

            try {
                currentUser = JSON.parse(
                    localStorage.getItem("currentUser")
                );
            } catch (error) {
                currentUser = null;
            }

            if (!currentUser) {

                reportMessage.textContent =
                    "Please login before submitting a report.";

                reportMessage.style.color =
                    "#c62828";

                return;
            }

            if (!category || !description) {

                reportMessage.textContent =
                    "Please complete the required fields.";

                reportMessage.style.color =
                    "#c62828";

                return;
            }

            reportMessage.textContent =
                "Submitting report...";

            reportMessage.style.color =
                "#000000";

            try {

                const response = await fetch(
                    `${API_BASE_URL}/api/reports`,
                    {
                        method: "POST",

                        credentials: "include",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        // IMPORTANT:
                        // Do not send user_id.
                        // Flask gets the user from the session.
                        body: JSON.stringify({
                            category: category,
                            description: description,
                            additional: additional
                        })
                    }
                );

                const data =
                    await response.json();

                if (data.success) {

                    reportMessage.textContent =
                        data.message ||
                        "Report submitted successfully.";

                    reportMessage.style.color =
                        "#2e7d32";

                    reportForm.reset();

                } else {

                    reportMessage.textContent =
                        data.message ||
                        "Unable to submit report.";

                    reportMessage.style.color =
                        "#c62828";
                }

            } catch (error) {

                console.error(
                    "Report submission error:",
                    error
                );

                reportMessage.textContent =
                    "Unable to connect to the backend. Make sure Flask is running.";

                reportMessage.style.color =
                    "#c62828";
            }
        }
    );
}


// ================================
// STUDENT PROFILE / REPORTS
// ================================

const reportsList =
    document.getElementById("reportsList");

if (reportsList) {

    let currentUser = null;

    try {

        currentUser = JSON.parse(
            localStorage.getItem("currentUser")
        );

    } catch (error) {

        currentUser = null;
        localStorage.removeItem("currentUser");
    }


    if (!currentUser) {

        window.location.href =
            "login.html";

    } else {

        // Display profile information

        const studentName =
            document.getElementById("studentName");

        const profileName =
            document.getElementById("profileName");

        const profileEmail =
            document.getElementById("profileEmail");

        const profileUserId =
            document.getElementById("profileUserId");

        const studentRole =
            document.getElementById("studentRole");

        const profileRole =
            document.getElementById("profileRole");


        if (studentName) {
            studentName.textContent =
                currentUser.name;
        }

        if (profileName) {
            profileName.textContent =
                currentUser.name;
        }

        if (profileEmail) {
            profileEmail.textContent =
                currentUser.email;
        }

        if (profileUserId) {
            profileUserId.textContent =
                "#" + currentUser.id;
        }

        if (studentRole) {
            studentRole.textContent =
                "Student Account";
        }

        if (profileRole) {
            profileRole.textContent =
                currentUser.role;
        }


        async function loadReports() {

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/reports`,
                        {
                            credentials: "include"
                        }
                    );

                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    reportsList.innerHTML =
                        "<p class='reports-error'>Unable to load your reports.</p>";

                    return;
                }


                const reports =
                    data.reports || [];


                const totalReports =
                    document.getElementById(
                        "totalReports"
                    );


                if (totalReports) {

                    totalReports.textContent =
                        reports.length;
                }


                if (reports.length === 0) {

                    reportsList.innerHTML = `
                        <div class="no-reports-card">
                            <div class="no-reports-icon">📋</div>

                            <h3>No Reports Yet</h3>

                            <p>
                                You have not submitted any cybersecurity
                                incident reports.
                            </p>

                            <a
                                href="report.html"
                                class="report-profile-button"
                            >
                                Report an Incident
                            </a>
                        </div>
                    `;

                    return;
                }


                reportsList.innerHTML = "";


                reports.forEach(function (report) {

                    const reportCard =
                        document.createElement("div");

                    reportCard.className =
                        "professional-report-card";


                    const date =
                        new Date(
                            report.created_at
                        );


                    reportCard.innerHTML = `

                        <div class="professional-report-header">

                            <div>

                                <span class="report-number">
                                    Report #${report.id}
                                </span>

                                <h3>
                                    ${escapeHTML(
                                        report.category
                                    )}
                                </h3>

                            </div>

                            <span class="report-status">
                                ${escapeHTML(
                                    report.status
                                )}
                            </span>

                        </div>


                        <div class="professional-report-body">

                            <div class="report-detail">

                                <span class="report-detail-label">
                                    Description
                                </span>

                                <p>
                                    ${escapeHTML(
                                        report.description
                                    )}
                                </p>

                            </div>


                            <div class="report-detail">

                                <span class="report-detail-label">
                                    Submitted
                                </span>

                                <p>
                                    ${date.toLocaleString()}
                                </p>

                            </div>

                        </div>
                    `;


                    reportsList.appendChild(
                        reportCard
                    );

                });

            } catch (error) {

                console.error(
                    "Error loading reports:",
                    error
                );

                reportsList.innerHTML =
                    "<p class='reports-error'>Unable to connect to the backend.</p>";
            }
        }


        // Only dashboard.html reaches this point.
        loadReports();
    }
}


// ================================
// LOGIN / REGISTER TABS
// ================================

const loginTab =
    document.getElementById("loginTab");

const registerTab =
    document.getElementById("registerTab");

const loginPanel =
    document.getElementById("loginPanel");

const registerPanel =
    document.getElementById("registerPanel");


if (
    loginTab &&
    registerTab &&
    loginPanel &&
    registerPanel
) {

    loginTab.addEventListener(
        "click",
        function () {

            loginTab.classList.add("active");

            registerTab.classList.remove(
                "active"
            );

            loginPanel.classList.remove(
                "hidden"
            );

            registerPanel.classList.add(
                "hidden"
            );
        }
    );


    registerTab.addEventListener(
        "click",
        function () {

            registerTab.classList.add(
                "active"
            );

            loginTab.classList.remove(
                "active"
            );

            registerPanel.classList.remove(
                "hidden"
            );

            loginPanel.classList.add(
                "hidden"
            );
        }
    );
}


// ================================
// REGISTER
// ================================

const registerForm =
    document.getElementById("registerForm");

const registerMessage =
    document.getElementById("registerMessage");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document
                    .getElementById("registerName")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("registerEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("registerPassword")
                    .value;


            if (!name || !email || !password) {

                registerMessage.textContent =
                    "Please fill in all fields.";

                registerMessage.style.color =
                    "#c62828";

                return;
            }


            registerMessage.textContent =
                "Creating account...";

            registerMessage.style.color =
                "#000000";


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (response.ok && data.success) {

                    registerMessage.textContent =
                        "Registration successful. You can now login.";

                    registerMessage.style.color =
                        "#2e7d32";

                    registerForm.reset();

                } else {

                    registerMessage.textContent =
                        data.message ||
                        "Registration failed.";

                    registerMessage.style.color =
                        "#c62828";
                }

            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                registerMessage.textContent =
                    "Unable to connect to the backend.";

                registerMessage.style.color =
                    "#c62828";
            }
        }
    );
}


// ================================
// LOGIN
// ================================

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            if (!email || !password) {

                loginMessage.textContent =
                    "Please enter your email and password.";

                loginMessage.style.color =
                    "#c62828";

                return;
            }


            loginMessage.textContent =
                "Logging in...";

            loginMessage.style.color =
                "#000000";


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/login`,
                        {
                            method: "POST",

                            // Required for Flask session cookie.
                            credentials: "include",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                if (response.ok && data.success) {

                    loginMessage.textContent =
                        "Login successful. Redirecting...";

                    loginMessage.style.color =
                        "#2e7d32";


                    // Store only basic UI information.
                    // Never store the password.
                    localStorage.setItem(
                        "currentUser",
                        JSON.stringify(data.user)
                    );


                    // IMPORTANT:
                    // Removed the old 1000ms delay.
                    // Redirect immediately.
                    if (data.user.role === "admin") {

                        window.location.href =
                            "admin.html";

                    } else {

                        window.location.href =
                            "dashboard.html";
                    }


                } else {

                    loginMessage.textContent =
                        data.message ||
                        "Login failed.";

                    loginMessage.style.color =
                        "#c62828";
                }

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                loginMessage.textContent =
                    "Unable to connect to the backend.";

                loginMessage.style.color =
                    "#c62828";
            }
        }
    );
}


// ================================
// LOGOUT
// ================================

const logoutButton =
    document.getElementById("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {

                await fetch(
                    `${API_BASE_URL}/api/auth/logout`,
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            } finally {

                localStorage.removeItem(
                    "currentUser"
                );

                window.location.href =
                    "index.html";
            }
        }
    );
}


// ================================
// ADMIN REPORT MANAGEMENT
// ================================

const adminReportsContainer =
    document.getElementById("adminReports");

const adminMessage =
    document.getElementById("adminMessage");


if (
    adminReportsContainer &&
    adminMessage
) {

    let currentUser = null;

    try {

        currentUser = JSON.parse(
            localStorage.getItem("currentUser")
        );

    } catch (error) {

        currentUser = null;
        localStorage.removeItem(
            "currentUser"
        );
    }


    if (!currentUser) {

        window.location.href =
            "login.html";

    } else if (
        currentUser.role !== "admin"
    ) {

        adminMessage.textContent =
            "Access denied. Admin access is required.";

        adminMessage.style.color =
            "#c62828";

    } else {

        // Only admin.html reaches here.
        loadAdminReports();
    }
}


// ================================
// LOAD ADMIN REPORTS
// ================================

async function loadAdminReports() {

    if (
        !adminReportsContainer ||
        !adminMessage
    ) {
        return;
    }


    adminMessage.textContent =
        "Loading reports...";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/reports`,
                {
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            adminMessage.textContent =
                data.message ||
                "Unable to load reports.";

            adminMessage.style.color =
                "#c62828";

            return;
        }


        const reports =
            data.reports || [];


        // ============================
        // STATISTICS
        // ============================

        const totalReports =
            reports.length;


        const underReviewReports =
            reports.filter(function (report) {

                return report.status ===
                    "Under Review";

            }).length;


        const resolvedReports =
            reports.filter(function (report) {

                return report.status ===
                    "Resolved";

            }).length;


        const totalReportsElement =
            document.getElementById(
                "adminTotalReports"
            );


        const reviewReportsElement =
            document.getElementById(
                "adminReviewReports"
            );


        const resolvedReportsElement =
            document.getElementById(
                "adminResolvedReports"
            );


        if (totalReportsElement) {

            totalReportsElement.textContent =
                totalReports;
        }


        if (reviewReportsElement) {

            reviewReportsElement.textContent =
                underReviewReports;
        }


        if (resolvedReportsElement) {

            resolvedReportsElement.textContent =
                resolvedReports;
        }


        adminMessage.textContent =
            `${totalReports} report(s) found.`;

        adminMessage.style.color =
            "#1F57F5";


        // ============================
        // DISPLAY REPORTS
        // ============================

        adminReportsContainer.innerHTML = "";


        if (reports.length === 0) {

            adminReportsContainer.innerHTML = `
                <div class="professional-report-card">
                    <p>No incident reports found.</p>
                </div>
            `;

            return;
        }


        reports.forEach(function (report) {

            const reportCard =
                document.createElement("div");


            reportCard.className =
                "professional-report-card";


            reportCard.innerHTML = `
                <div class="report-card-header">

                    <div>

                        <h3>
                            Report #${report.id}
                        </h3>

                        <p>
                            ${escapeHTML(
                                report.name
                            )}
                            (${escapeHTML(
                                report.email
                            )})
                        </p>

                    </div>

                    <span class="report-status">
                        ${escapeHTML(
                            report.status
                        )}
                    </span>

                </div>


                <div class="report-card-body">

                    <p>
                        <strong>Category:</strong>
                        ${escapeHTML(
                            report.category
                        )}
                    </p>

                    <p>
                        <strong>Description:</strong>
                    </p>

                    <p>
                        ${escapeHTML(
                            report.description
                        ).replace(/\n/g, "<br>")}
                    </p>

                    <p>
                        <strong>Submitted:</strong>
                        ${new Date(
                            report.created_at
                        ).toLocaleString()}
                    </p>


                    <div class="admin-status-control">

                        <label>
                            Update Status
                        </label>

                        <select
                            class="admin-status-select"
                            data-report-id="${report.id}"
                        >

                            <option
                                value="Submitted"
                                ${report.status === "Submitted"
                                    ? "selected"
                                    : ""}
                            >
                                Submitted
                            </option>

                            <option
                                value="Under Review"
                                ${report.status === "Under Review"
                                    ? "selected"
                                    : ""}
                            >
                                Under Review
                            </option>

                            <option
                                value="Resolved"
                                ${report.status === "Resolved"
                                    ? "selected"
                                    : ""}
                            >
                                Resolved
                            </option>

                        </select>

                    </div>

                </div>
            `;


            adminReportsContainer.appendChild(
                reportCard
            );


            const statusSelect =
                reportCard.querySelector(
                    ".admin-status-select"
                );


            statusSelect.addEventListener(
                "change",
                function () {

                    updateReportStatus(
                        report.id,
                        this.value
                    );
                }
            );

        });

    } catch (error) {

        console.error(
            "Admin reports error:",
            error
        );

        adminMessage.textContent =
            "Unable to connect to the backend.";

        adminMessage.style.color =
            "#c62828";
    }
}


// ================================
// UPDATE REPORT STATUS
// ================================

async function updateReportStatus(
    reportId,
    newStatus
) {

    if (
        !adminMessage ||
        !adminReportsContainer
    ) {
        return;
    }


    adminMessage.textContent =
        "Updating report status...";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/reports/${reportId}/status`,
                {
                    method: "PUT",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    // Do not send admin_id.
                    // Flask gets admin identity from session.
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );


        const data =
            await response.json();


        if (response.ok && data.success) {

            adminMessage.textContent =
                `Report #${reportId} status changed to ${newStatus}.`;

            adminMessage.style.color =
                "#2e7d32";


            // Reload only the admin page data.
            await loadAdminReports();

        } else {

            adminMessage.textContent =
                data.message ||
                "Unable to update report status.";

            adminMessage.style.color =
                "#c62828";
        }

    } catch (error) {

        console.error(
            "Status update error:",
            error
        );

        adminMessage.textContent =
            "Unable to update report status.";

        adminMessage.style.color =
            "#c62828";
    }
}


// ================================
// HTML ESCAPE HELPER
// ================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


console.log(
    "Cyber Awareness frontend loaded successfully."
);