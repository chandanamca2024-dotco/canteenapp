# PROJECT SYNOPSIS

## 1. SYNOPSIS

### 1.1 Title of the Project
**"DineDesk"**

### 1.2 Objective of the Project

- To avoid long queues in the college canteen.
- To allow students and staff to order food online.
- To provide secure login using Email & Password and Google Authentication.
- To enable cashless payments through Razorpay.
- To reward frequent users using a Loyalty and Rewards system.
- To provide real-time order tracking.
- To help canteen staff manage orders efficiently.
- To provide admin monitoring and reporting facilities.

### 1.3 Project Category
**Mobile Application Development (Cross-Platform React Native)**  
**Domain**: College Canteen / Food Ordering System

### 1.4 Software and Hardware Requirements

#### 1. Software Requirements

| Component | Specification |
|-----------|--------------|
| **Operating System** | Windows 10 / 11, macOS |
| **Framework** | React Native (CLI) |
| **Programming Language** | JavaScript / TypeScript |
| **Backend & Database** | Supabase (PostgreSQL) |
| **Authentication** | Email & Password Login, Google Login |
| **Payment Gateway** | Razorpay |
| **IDE** | VS Code |

#### 2. Hardware Requirements

| Component | Specification |
|-----------|--------------|
| **Processor** | Quad Core CPU or higher |
| **Memory** | Minimum 4GB RAM (8GB recommended) |
| **Storage** | Minimum 10GB free space |
| **Internet** | 4G/5G / Wi-Fi connectivity |
| **Device** | Android 8.0+ / iOS 12+ smartphone |

---

## 1.5 Structure of the Program

### 1.5.1 Analysis

- Users can register and login using Email–Password or Google account.
- Students and staff can browse menu, place orders, and track order status.
- Loyalty points are awarded for every successful order.
- Canteen staff manage food preparation and order updates.
- Admin manages users, menu items, and views reports.
- The system follows secure role-based authentication.

---

### 1.5.2 Data Structures

**Our project consists of following tables:**

#### 1) Profiles
- User ID
- Name
- Email
- Password
- Login Type (Email/Google)
- Role (User/Staff/Admin)
- Created At
- Updated At

#### 2) Menu_Items
- Item ID
- Item Name
- Price
- Image URL
- Availability Status
- Created At

#### 3) Orders
- Order ID
- User ID
- Total Amount
- Order Status
- Created At

#### 4) Order_Items
- Order Item ID
- Order ID
- Item ID
- Quantity

#### 5) Transactions
- Transaction ID
- Order ID
- Amount
- Payment Status
- Payment Method

#### 6) Loyalty_Rewards
- User ID
- Total Points
- Points Earned
- Points Redeemed

#### 7) Feedback
- Feedback ID
- User ID
- Rating
- Comments
---

### 1.5.3 Module Description

#### 1) Authentication Module
- Login
- Registration
- Logout
- Session Handling

#### 2) User Module
- Browse Menu
- Place Order
- Online Payment
- Earn & Redeem Loyalty Points
- View Order History

#### 3) Canteen Staff Module
- View Incoming Orders
- Update Order Status
- Manage Food Availability

#### 4) Admin Module
- Manage Users
- Manage Menu Items
- View Orders and Reports
- Monitor Loyalty Usage

---

## 1.6 Limitations

- Internet connection is required.
- Razorpay supports limited regions.
- Single-canteen implementation.
- No offline ordering support.

---

## 1.7 Future Scope of the Project

- Multi-canteen support.
- Advanced loyalty reward levels.
- QR-based ordering system.
- AI-based food recommendations.
- Multi-language support.
- Detailed analytics dashboard.

---

**Document Version**: 2.0  
**Last Updated**: January 3, 2026  
**Project Status**: ✅ Active Development

---
