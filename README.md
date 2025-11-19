# **Survey App Builder**

A full-stack application for building, managing, and distributing customizable surveys.  
Supports advanced question types, branching logic, analytics, and SSO integration.

---

## **Tech Stack**

### **Frontend**
- **HTML5** – Structure and layout for all UI screens  
- **TailwindCSS 4** – Utility-first CSS for modern and responsive styling  
- **React (Vite)** – Fast, component-based frontend development  
- **TypeScript** – Type-safe, scalable frontend logic  

---

### **Backend**
- **Node.js** – Server-side runtime  
- **Express.js** – Framework for building REST APIs  
- **JWT Authentication** – Secure, stateless access control for creators and respondents  

---

### **Database**
- **MongoDB** – Stores surveys, questions, users, responses, analytics  
- **Mongoose** – Schema modeling, validation, and query layer  

---

## **Application Features**

### **1. User Authentication (JWT-based)**

The application uses JSON Web Tokens (JWT) for secure, stateless authentication.

#### **How it Works**
- Creator logs in → server verifies credentials  
- Server generates:  
  - Access Token – short-lived, used for API authorization  
  - Refresh Token – long-lived, used to obtain new access tokens  

---

### **2. Respondent & Group Management**

Creators control who can take each survey.

#### **Key Capabilities**
- Create respondent profiles  
- Create respondent groups 
- Add respondents/groups to surveys in Draft and Published modes  
- Send invitations once survey is Live
- Track respondent progress and completion  

---

### **3. Survey Builder (Drag & Drop)**

A flexible and visual builder for assembling surveys.

#### **Supported Question Types**
- Short Text  
- Long Text  
- Slider  
- Star Rating  
- Smiley Rating  
- Number Rating  
- Checkbox (multi-select)  
- Dropdown  
- Single Choice (radio)

#### **Builder Customization Options**
- Add / remove / reorder questions  
- Set background & text color  
- Set start date and end date  
- Add respondents before publishing  
- Import, export, and duplicate surveys  

---

## **4. Survey Modes**

### **Draft Mode**
- Full editing allowed  
- Add/modify questions  
- Change design (background + text color)  
- Set dates  
- Add respondents  
- Save anytime as draft  
- Delete Survey
- Can set visibility rules for each question based on previous answers

### **Published Mode**
- Survey finalized but not active  
- “Go Live” enables instant activation  
- Update start/end dates  
- Add more respondents  
- Cannot add or edit questions 

### **Live Mode**
- Add respondents and send invitations  
- Track respondent progress in real-time  
- View individual responses  
- View question-wise aggregated responses  
- Can close surveys

### **Closed Mode**
- Analytics dashboard available for viewing 
- Full respondent progress 
- Response details can be viewed both respondent-wise and question-wise 
- Survey cannot be deleted (only archived)  
- Ideal for evaluation and reporting  
- Can archive surveys

### **Archived Mode**
- Same visibility as Closed Mode  
- Read-only  
- Cannot delete or modify surveys  

---

## **5. Templates**
- Import surveys as templates  
- Preview template before using  
- Quickly generate surveys using saved designs  

---

## **6. Respondent Experience**
- Auto-save every 1 minute 
- Can exit survey anytime  
- Can resume from saved progress  
- Clean, distraction-free interface  

---

## **7. Analytics Dashboard**
- Visual charts for each question  
- Summary of overall responses  
- Respondent progress overview  
- Exportable insights  

---

## Database Schemas (Mongoose / MongoDB)

The backend uses seven interconnected schemas to manage authentication, surveys, respondents, invitations, and responses.

---

### **1. User (User.ts)**
**Purpose:** Stores creator and respondent login information, authentication details, and SSO metadata.  
**Why it's needed:** To authenticate users and determine whether they are creators or respondents.

---

### **2. Respondent (Respondent.ts)**
**Purpose:** Stores individual respondent profiles that creators can invite to surveys.  
**Why it's needed:** To uniquely identify each respondent and store their personal/contact details.

---

### **3. RespondentGroup (RespondentGroup.ts)**
**Purpose:** Organizes respondents into groups for bulk invitations.  
**Why it's needed:** To easily manage and invite large sets of respondents at once.

---

### **4. Survey (Survey.ts)**
**Purpose:** Defines the structure, pages, questions, colors, dates, and branching logic of a survey.  
**Why it's needed:** To store the full blueprint of every survey and control its lifecycle (draft → published → live → closed → archived).

---

### **5. Template (Template.ts)**
**Purpose:** Stores reusable survey templates accessible to creators.  
**Why it's needed:** To allow creators to quickly build surveys using predefined structures.

---

### **6. SurveyRespondents (SurveyRespondents.ts)**
**Purpose:** Links a survey to its allowed respondents or groups and tracks invitation status.  
**Why it's needed:** To control who can access a survey and track invitations sent to each respondent.

---

### **7. Response (Response.ts)**
**Purpose:** Stores answers submitted by respondents, along with progress, timestamps, and auto-save data.  
**Why it's needed:** To save each respondent’s answers, track their progress, and enable resume-later functionality.

---
