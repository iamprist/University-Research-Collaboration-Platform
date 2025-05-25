
# Innerk Hub – University Research Collaboration Platform

[![codecov](https://codecov.io/gh/iamprist/University-Research-Collaboration-Platform/branch/skeletoncode/graph/badge.svg?token=EIG69HYXA7)](https://codecov.io/gh/iamprist/University-Research-Collaboration-Platform)

**Innerk Hub** is a web-based application designed to streamline academic research collaboration in universities. It helps researchers find collaborators, manage projects, share documents, track funding, and receive guidance from reviewers—all in one unified platform.

Academic research often suffers from fragmented collaboration, difficulty in finding domain experts, and inefficient tracking of project progress and funding. Innerk Hub addresses these problems by providing a centralized, secure, and user-friendly platform tailored for academic environments.
 Objectives
* Enable researchers to **post and manage research projects**.
* Provide tools for **collaboration** including messaging, document sharing, and progress tracking.
* Allow **reviewers** to supervise and give feedback on relevant research topics.
* Help researchers **track funding** and grants with clear dashboards.
* Support **admins** in overseeing platform usage and managing user roles.



## 🛠️ Features Overview

| Feature                             | Description                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| **User Verification**            | Third-party authentication (Google firebase Sign-In), with roles: Researcher, Reviewer, Admin |
| **Project Management**           | Create listings, define requirements, invite collaborators                           |
|  **Collaboration Tools**          | Real-time messaging, document sharing, milestone tracking                            |
|  **Funding Tracker**              | Monitor grants, spending, and future funding needs                                   |
| **Reports**                      | Exportable dashboards: Project status, Funding summary, Custom reports               |
|                        |

---

##  Testing

* Unit testing using **Jest**
* Test cases follow **Given-When-Then** format
* Integrated with **Codecov** for code coverage reporting
* UATs conducted for all major features

---

## Technologies Used

* **React** + **Vite**
* **Firebase** (Authentication, Firestore, Storage)
* **Bootstrap 5** + Custom CSS
* **GitHub Actions** (CI/CD)
* **Jest** + **Codecov** (Testing)

---

## 👥 Team Members

| Name       | Role          |
| ---------- | ------------- |
| Nonhlanhla | Product Owner |
| Pretty     | Scrum Master  |
| Smiso      | UI Lead       |
| Nkosinathi | Developer     |
| Khulekani  | Developer     |
| Zainab     | Developer     |

---

##  Future Improvements

* AI collaborator matching via research tags
* Reviewer recommendations based on prior work
* Improved funding report analytics
* Integration with external research repositories (e.g., arXiv, ORCID)

---

## Repository Structure (Simplified)

```
/src
  /components
  /pages
  /services
  /utils
/tests
/.github/workflows (CI config)
README.md
```

---

##  License

This project is developed for educational purposes as part of the **Software Design (COMS3003A)** course at the University of the Witwatersrand, 2025.

---


