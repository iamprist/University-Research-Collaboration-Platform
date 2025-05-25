
---

# Innerk Hub – University Research Collaboration Platform

[![codecov](https://codecov.io/gh/iamprist/University-Research-Collaboration-Platform/branch/skeletoncode/graph/badge.svg?token=EIG69HYXA7)](https://codecov.io/gh/iamprist/University-Research-Collaboration-Platform)

**Innerk Hub** is a full-stack web application designed to streamline research collaboration in academic environments. The platform connects researchers, facilitates project and funding management, and provides tools for real-time communication, supervision, and progress tracking.

> Developed for the **COMS3003A Software Design** course at the **University of the Witwatersrand**, 2025.

---

##  Objectives

* Centralize research collaboration in a single platform
* Enable transparent research project and milestone management
* Facilitate supervision and reviewer feedback mechanisms
* Track and manage research funding and grant usage
* Empower admins with usage monitoring and role management

---

## 🚀 Features Overview

| Feature                     | Description                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------- |
| 🔐 **User Verification**    | Firebase Google Sign-In with three roles: **Researcher**, **Reviewer**, and **Admin** |
| 🧪 **Project Management**   | Researchers can post projects, define team needs, and invite collaborators            |
| 💬 **Collaboration Tools**  | Real-time messaging, document sharing, and milestone tracking                         |
| 💰 **Funding Tracker**      | Manage grants, spending logs, and funding forecast dashboards                         |
| 📊 **Reports & Dashboards** | Export project data as CSV/PDF, with support for custom analytics views               |
| 🤖 **AI Recommendations**   | *(Planned)* Match reviewers to projects based on expertise tags                       |

---

##  Testing & Quality Assurance

* **Unit Testing** using [Jest](https://jestjs.io/)
* **User Acceptance Testing (UAT)** with the Given-When-Then approach
* **Code Coverage** tracked with [Codecov](https://codecov.io/)
* **CI/CD Pipeline** via GitHub Actions for automated testing & deployment

---

##  Technologies Used

* **Frontend**: React + Vite
* **Backend & Services**: Firebase Auth, Firestore, Firebase Storage
* **Styling**: Bootstrap 5 + Custom CSS
* **Testing**: Jest, Codecov
* **CI/CD**: GitHub Actions
* **Agile Tooling**: Trello for sprint and task tracking
* **Hosting**: **Microsoft Azure**

---

## 📁 Project Structure

```
/src
  /components       # Reusable UI components
  /pages            # Route-level pages
  /services         # Firebase/Firestore interactions
  /utils            # Helper functions
/tests              # Unit tests
/.github/workflows  # CI/CD configurations
README.md
```

---

## 👥 Team Members

| Name                  | Role          |
| --------------------- | ------------- |
| Nonhlanhla Sindane    | Product Owner |
| Pretty Mangwadi       | Scrum Master  |
| Smiso Ndlovu          | UI Lead       |
| Nkosinathi Tshabalala | Developer     |
| Khulekani Mtshali     | Developer     |
| Zainab Lorgat         | Developer     |

---

##  Future Enhancements

* AI-powered collaborator suggestions using tag/expertise matching
* Reviewer suggestions based on past research contributions
* Integration with external data sources (e.g., arXiv, ORCID)
* Funding analytics and prediction models
* Research project version control and history

---

##  License

This repository is developed for **educational purposes only** as part of the Wits **COMS3003A Software Design** course in 2025.

---
