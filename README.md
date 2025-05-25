
---

# Innerk Hub – University Research Collaboration Platform

[![codecov](https://codecov.io/gh/iamprist/University-Research-Collaboration-Platform/branch/skeletoncode/graph/badge.svg?token=EIG69HYXA7)](https://codecov.io/gh/iamprist/University-Research-Collaboration-Platform)

**Innerk Hub** is a full-stack web application built to streamline research collaboration in academic environments. The platform connects researchers, facilitates project and funding management, and offers a space for real-time communication, feedback, and supervision.

> Developed for the **COMS3003A Software Design** course at the **University of the Witwatersrand**, 2025.

---

## Objectives

* Simplify collaboration between researchers through a centralized platform.
* Enable research project management and transparent progress tracking.
* Support supervision and reviewer feedback mechanisms.
* Track and manage research funding and grants.
* Empower administrators to monitor usage and manage user roles effectively.

---

##  Features Overview

| Feature                     | Description                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 🔐 **User Verification**    | Third-party authentication (Firebase Google Sign-In) with 3 roles: **Researcher**, **Reviewer**, **Admin** |
| 🧪 **Project Management**   | Researchers can create listings, define team requirements, and invite collaborators                        |
| 💬 **Collaboration Tools**  | Built-in real-time messaging, document sharing, milestone tracking                                         |
| 💰 **Funding Tracker**      | Grant tracking, spending logs, and funding forecast dashboards                                             |
| 📊 **Reports & Dashboards** | Exportable project reports (CSV/PDF), custom analytics views                                               |
| 🤖 **AI Recommendations**   | (Planned) Match reviewers to projects based on expertise tags                                              |

---

## Testing & Quality Assurance

* **Unit Testing** with [Jest](https://jestjs.io/)
* **User Acceptance Tests (UAT)** using Given-When-Then format
* **Code Coverage** tracked with [Codecov](https://codecov.io/)
* **CI/CD** pipeline via GitHub Actions for automated testing & deployment

---

## ⚙Technologies Used

*  **React + Vite** (Frontend)
*  **Firebase** – Auth, Firestore, Storage
*  **Bootstrap 5** + Custom CSS
*  **Jest**, **Codecov** (Testing)
*  **GitHub Actions** (CI/CD)
* **Trello** for Agile workflow & sprint tracking

---

## 📂 Project Structure

```
/src
  /components       # Reusable UI components
  /pages            # Route-level pages
  /services         # Firebase/Firestore interactions
  /utils            # Helper functions
/tests              # Unit tests
/.github/workflows  # CI/CD configuration
README.md
```

---

## Team Members

| Name                  | Role          |
| --------------------- | ------------- |
| Nonhlanhla Sindane    | Product Owner |
| Pretty Mangwadi       | Scrum Master  |
| Smiso Ndlovu          | UI Lead       |
| Nkosinathi Tshabalala | Developer     |
| Khulekani Mtshali     | Developer     |
| Zainab Lorgat         | Developer     |

---


---

## Future Enhancements

* AI-powered collaborator suggestions using tag matching
* Reviewer recommendations based on past research
* External data integration (e.g., arXiv, ORCID)
* Funding prediction analytics
* Research project version control

---

## License

This repository is developed for **educational purposes only** as part of the Wits **COMS3003A Software Design** course in 2025.

---

