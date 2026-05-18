# Nha Dat Pro / Dia Oc Hub Poster Brief Report

## 1. Project Identity

**Product name in repository:** Nha Dat Pro  
**Brand name shown in the app UI:** Dia Oc Hub / Địa Ốc Hub  
**Vietnamese tagline from the UI:** Nền tảng quản lý bất động sản  
**Suggested poster tagline:** Quản lý nhà cho thuê, hợp đồng và dòng tiền trong một nơi duy nhất.

Nha Dat Pro is a web-based property management application for Vietnamese landlords, property managers, and tenants. The app centralizes rental operations that are usually scattered across spreadsheets, chat messages, bank transfer screenshots, and manual bookkeeping.

The strongest advertising message is:

**A complete rental operations hub for owners, managers, and tenants: manage properties, leases, invoices, payments, expenses, revenue, and notifications in one secure system.**

## 2. Target Audience

### Primary users

- **Property owners / landlords:** people who own rental properties, rooms, apartments, mini-apartments, or boarding houses and need to track units, leases, payments, and income.
- **Property managers / caretakers:** people hired to manage assigned properties, handle tenant requests, create leases, collect rent, review payments, and record expenses.
- **Tenants / residents:** renters who need a simple place to view contracts, receive invoices, pay rent, upload proof, and track payment status.

### Ideal market context

The application is especially suitable for small and medium rental property operations in Vietnam, where rental management is often handled manually through spreadsheets, Zalo/Facebook messages, printed contracts, and bank transfer screenshots.

## 3. Core Problem

Rental property management becomes difficult when owners and managers have to track:

- property and room information manually
- tenant connection requests through chat
- lease start dates, end dates, deposits, and rent terms
- monthly invoices
- proof of bank transfer payments
- unpaid or overdue rent
- operating expenses
- manager assignments
- expiring contracts and operational alerts

Nha Dat Pro solves this by turning the entire rental lifecycle into one structured digital workflow.

## 4. Product Promise

**For owners:** Know which units are occupied, how much rent has been collected, which payments need review, and whether the business is profitable.  
**For managers:** Manage assigned properties without needing full owner access.  
**For tenants:** View contracts, follow VietQR payment instructions, and upload payment proof from one place.

## 5. Main Feature Set

### Authentication and access control

- Manual email/password login
- Manual registration by role: owner, manager, tenant
- Optional Google login and onboarding
- Custom JWT cookie session authentication
- Role-based route protection for owner, manager, tenant, and admin users

### Owner features

- Owner dashboard with occupied unit count, collected rent, and net income
- Create, edit, search, and archive properties
- Create and edit rental units
- Track total units, occupied units, and vacant units
- Generate tenant invite codes for units
- Generate manager invite codes for properties
- Review tenant connection requests
- Review manager assignment requests
- Create leases from approved tenant requests
- Terminate leases while preserving history
- Remove manager assignments while preserving history
- Configure receiving bank accounts for property payments
- Generate monthly invoices
- Review, approve, or reject tenant payment proofs
- View revenue analytics
- Add, edit, and void expenses
- View notifications for overdue invoices, expiring leases, and operations

### Manager features

- Manager dashboard for assigned properties
- Request property assignment using manager invite codes
- View assigned properties
- Manage units within assigned property scope
- Review tenant connection requests for assigned properties
- Create leases from approved requests
- Leave property assignment when no longer responsible
- Generate invoices for assigned properties
- Review payment proofs for assigned properties
- View assigned-property revenue analytics
- Record expenses for assigned properties
- Void expenses they created
- View role-scoped notifications

### Tenant features

- Tenant dashboard showing active leases and outstanding invoices
- Connect to a rental unit using a unit invite code
- Track pending connection requests
- View active contracts
- Request early lease termination
- View monthly rent invoices
- See VietQR/manual bank transfer payment instructions
- Upload payment proof files
- Track payment review status: unpaid, pending review, partially paid, paid, overdue, rejected
- View payment history
- Receive notifications for overdue invoices and expiring leases

### Finance and payment features

- Monthly invoice preview before creation
- Bulk invoice creation for active leases
- Single invoice creation
- Rent, utility amount, management fee, penalty, and other fee support
- Invoice statuses for unpaid, pending review, partially paid, paid, and overdue
- Tenant payment proof upload through a private storage flow
- Payment proof review by owners or assigned managers
- Verified payments count toward invoice totals
- Property receiving account setup for bank transfer instructions
- VietQR-ready payment instruction display

### Revenue and expense features

- Monthly revenue analytics
- Total invoiced amount
- Total verified paid amount
- Total expenses
- Net operating income
- Performance breakdown by property
- Expense breakdown by category
- Expense history
- Expense categories such as maintenance, repair, utility, cleaning, management, tax, insurance, marketing, supplies, and other
- Void instead of hard-delete for audit-friendly history

### Notification and alert features

- Role-based notifications
- Unread notification count
- Alerts for overdue invoices
- Alerts for lease expiration
- Alert deduplication to prevent repeated duplicate messages
- Mark one or all notifications as read

## 6. Role-Based User Journey

### Owner journey

1. Register or log in as owner.
2. Add properties and units.
3. Generate invite codes for managers or tenants.
4. Approve manager or tenant requests.
5. Create leases from approved tenant connections.
6. Generate rent invoices every month.
7. Review uploaded payment proofs.
8. Track paid rent, expenses, and net income.
9. Receive alerts for overdue invoices and upcoming lease events.

### Manager journey

1. Register or log in as manager.
2. Enter a property manager invite code.
3. Wait for owner approval.
4. Manage assigned properties and units.
5. Approve tenant requests and create leases.
6. Generate invoices and review payments for assigned properties.
7. Record expenses and monitor performance.

### Tenant journey

1. Register or log in as tenant.
2. Enter a unit invite code.
3. Wait for owner/manager approval.
4. View active rental contract.
5. Receive monthly invoices.
6. Pay using VietQR/manual transfer instructions.
7. Upload proof of payment.
8. Track verification status and payment history.

## 7. Unique Selling Points for the Poster

- **Three roles, one connected workflow:** owner, manager, and tenant use the same system with different permissions.
- **Invite-code onboarding:** tenants and managers connect to the right property/unit through controlled invite codes.
- **Lease-first operations:** leases are the real contract records, not loose notes or fake draft data.
- **Rent collection with proof review:** tenants upload payment evidence; owners/managers approve or reject it.
- **VietQR-ready payment instructions:** designed for Vietnamese rental payment habits.
- **Revenue visibility:** owners can see collected rent, expenses, and net operating income.
- **History-preserving operations:** leases, expenses, assignments, and archives protect operational records.
- **Role-scoped notifications:** users see the alerts relevant to their responsibilities.

## 8. Suggested Poster Headline Options

### Vietnamese

1. **Địa Ốc Hub**
2. **Quản lý nhà cho thuê trong một nơi duy nhất**
3. **Từ hợp đồng đến thanh toán, mọi thứ rõ ràng hơn**
4. **Nền tảng quản lý bất động sản cho chủ nhà, quản gia và cư dân**
5. **Thu tiền nhà, quản lý hợp đồng, theo dõi doanh thu dễ dàng**

### English

1. **Nha Dat Pro**
2. **One Hub for Rental Property Management**
3. **Manage Properties, Leases, Payments, and Revenue**
4. **Built for Owners, Managers, and Tenants**
5. **From Rent Collection to Revenue Insights**

## 9. Suggested Poster Body Copy

### Vietnamese short version

Địa Ốc Hub giúp chủ nhà, quản gia và cư dân quản lý toàn bộ quy trình thuê nhà trên một nền tảng: tài sản, căn hộ, hợp đồng, hóa đơn, thanh toán VietQR, chứng từ, chi phí, doanh thu và thông báo vận hành.

### Vietnamese feature bullets

- Quản lý tài sản và căn hộ
- Kết nối cư dân và quản gia bằng mã mời
- Tạo hợp đồng thuê từ yêu cầu đã duyệt
- Tạo hóa đơn tiền thuê theo tháng
- Thanh toán qua VietQR và tải chứng từ
- Duyệt hoặc từ chối chứng từ thanh toán
- Theo dõi doanh thu, chi phí và lợi nhuận ròng
- Nhận thông báo hóa đơn quá hạn và hợp đồng sắp hết hạn

### English short version

Nha Dat Pro helps owners, managers, and tenants manage the full rental lifecycle in one platform: properties, units, leases, invoices, VietQR payments, payment proof review, expenses, revenue analytics, and operational notifications.

## 10. Recommended Poster Sections

1. **Hero:** Địa Ốc Hub / Nền tảng quản lý bất động sản
2. **Core promise:** Quản lý nhà cho thuê, hợp đồng và dòng tiền trong một nơi duy nhất.
3. **Three user roles:** Chủ nhà, Quản gia, Cư dân
4. **Feature cluster:** Tài sản, Hợp đồng, Hóa đơn, Thanh toán, Doanh thu, Thông báo
5. **Trust/tech line:** Built with Next.js, TypeScript, PostgreSQL, Prisma, and secure private file storage
6. **Call to action:** Bắt đầu quản lý bất động sản thông minh hơn

## 11. Visual Direction

The existing app uses a warm, professional, property-management look. It feels more like a trusted operations dashboard than a flashy real estate marketplace.

Recommended poster style:

- Clean Vietnamese SaaS dashboard aesthetic
- Warm neutral background
- Strong amber/orange primary brand color
- Dark charcoal typography
- White dashboard cards
- Subtle cyan accent for modern financial/payment energy
- Use building, wallet, invoice, QR code, bell, and chart icons
- Use screenshots or dashboard mockups if available
- Avoid making it look like a luxury real estate sales poster; this app is an operations tool

## 12. Exact Color Theme

These colors come from the current app theme in `src/app/globals.css`.

### Primary palette

- **Brand Primary / Main CTA:** `#D98725`
- **Brand Primary Deep / Hover:** `#C2771F`
- **Brand Secondary / Warm Neutral:** `#A78358`
- **Brand Accent / Modern Payment Highlight:** `#19BDFF`
- **Brand Ink / Main Text:** `#1A1A1A`
- **Brand Muted / Secondary Text:** `#757575`
- **Brand Border:** `#E8E1D6`
- **Brand Soft Background:** `#F8F5EE`
- **Brand Card:** `#FFFFFF`
- **Brand Danger:** `#D34545`
- **Brand Success:** `#1F8B5C`

### Recommended poster color roles

- Background: `#F8F5EE`
- Main headline: `#1A1A1A`
- Primary brand block / buttons / icon background: `#D98725`
- Darker accent for depth: `#C2771F`
- Subtle dividers and card outlines: `#E8E1D6`
- Card surfaces: `#FFFFFF`
- Secondary supporting text: `#757575`
- Financial success highlights: `#1F8B5C`
- Payment/QR highlight accent: `#19BDFF`
- Warning/overdue accent, used sparingly: `#D34545`

### Poster palette recommendation

Use this exact poster palette:

- **Cream canvas:** `#F8F5EE`
- **Amber brand:** `#D98725`
- **Deep amber:** `#C2771F`
- **Charcoal text:** `#1A1A1A`
- **Muted gray:** `#757575`
- **Soft border:** `#E8E1D6`
- **White cards:** `#FFFFFF`
- **Cyan payment accent:** `#19BDFF`
- **Green revenue accent:** `#1F8B5C`

Suggested ratio:

- 55% cream background
- 20% white cards/dashboard mockups
- 15% amber/deep amber brand areas
- 7% charcoal typography
- 3% cyan/green status accents

## 13. Typography Recommendation

The app uses:

- **Headings:** Plus Jakarta Sans
- **Body/UI text:** Inter

For the poster:

- Main title: Plus Jakarta Sans ExtraBold or Black
- Section headings: Plus Jakarta Sans Bold
- Body copy: Inter Medium or SemiBold
- Small labels: Inter Bold uppercase

## 14. Suggested Poster Layout

### Layout A: Dashboard Hero

Top:
Địa Ốc Hub  
Quản lý nhà cho thuê, hợp đồng và dòng tiền trong một nơi duy nhất.

Middle:
Large dashboard mockup showing:

- occupied units
- rent collected this month
- net operating income
- invoice status
- payment proof review

Bottom:
Three role cards:

- Chủ nhà: quản lý tài sản, hóa đơn, doanh thu
- Quản gia: vận hành tài sản được giao
- Cư dân: xem hợp đồng, thanh toán, tải chứng từ

### Layout B: Three-Role Workflow

Left-to-right flow:

Chủ nhà -> Quản gia -> Cư dân

Under it:

Tài sản -> Hợp đồng -> Hóa đơn -> VietQR -> Chứng từ -> Doanh thu

This layout is very clear for an academic or demo poster.

## 15. Key Metrics and Data Points to Display

Use these as sample dashboard cards on the poster:

- Đã có người thuê
- Đã thu tháng này
- Lợi nhuận ròng
- Thanh toán chờ duyệt
- Còn phải thanh toán
- Chứng từ chờ duyệt
- Đã xác nhận
- Chi phí tháng này

## 16. Suggested Icon List

Use simple line icons matching the app style:

- Building icon for properties
- Door/unit icon for rental rooms
- File/text icon for leases
- Wallet icon for rent collection
- QR code icon for payment
- Upload icon for payment proof
- Check circle icon for approved payments
- Bell icon for notifications
- Trending chart icon for revenue

## 17. Technical Credibility Line

For a poster footer or small badge:

**Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7, PostgreSQL, JWT session auth, Google OAuth, and Supabase private storage.**

## 18. Full Feature Keywords for NotebookLM

Property management, rental management, landlord dashboard, tenant portal, property manager workflow, unit management, invite code onboarding, lease creation, lease termination, monthly invoices, rent collection, VietQR payment instructions, payment proof upload, payment verification, private file storage, revenue analytics, expense tracking, net operating income, overdue invoice alerts, lease expiration alerts, role-based access control, Vietnamese rental operations, Next.js app, PostgreSQL database.

## 19. Best One-Sentence Summary

**Địa Ốc Hub is a Vietnamese rental property management platform that connects owners, managers, and tenants through one system for properties, leases, invoices, VietQR payments, expenses, revenue analytics, and operational notifications.**

