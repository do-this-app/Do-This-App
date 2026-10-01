export interface SampleDocument {
  id: string;
  name: string;
  category: string;
  badge: string;
  content: string;
  hint: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'sample-medical-bill',
    name: 'Overdue Medical Diagnostic Bill',
    category: 'Medical / Healthcare',
    badge: 'Urgent Deadline',
    hint: 'Contains $482.00 balance, explicit collections deadline in 14 days, and insurance dispute rights.',
    content: `METROPOLITAN RADIOLOGY ASSOCIATES
1400 Medical Center Parkway, Suite 300
Chicago, IL 60611
Billing Inquiries: (800) 555-0199 | Patient Portal: metro-rad-pay.org

DATE OF NOTICE: October 01, 2026
ACCOUNT NUMBER: MRA-8839210-A
PATIENT: Alex Morgan
DATE OF SERVICE: August 14, 2026
PROCEDURE: CPT 74177 - Computed Tomography (CT) Abdomen & Pelvis with Contrast

STATEMENT OF ACCOUNT - SECOND & FINAL NOTICE:
Original Billed Amount: $1,850.00
Primary Insurance Paid (BlueCross): $1,218.00
Contractual Adjustment: $150.00
PATIENT RESPONSIBILITY (Deductible/Coinsurance): $482.00
Previous Payments: $0.00
TOTAL AMOUNT CURRENTLY DUE: $482.00

CRITICAL PAYMENT NOTICE:
Our records indicate your balance of $482.00 is now 48 days overdue.
PAYMENT DEADLINE: Payment must be received by 5:00 PM CST on October 15, 2026.

CONSEQUENCES OF NON-PAYMENT:
If full payment or an approved hardship payment installment arrangement is not established by October 15, 2026, this account will be transferred to NorthStar Collections Bureau. Placement in collections may affect your credit score and incur an additional 18% administrative fee.

DISPUTE & FINANCIAL ASSISTANCE RIGHTS:
If you believe this charge was billed in error or should have been covered under in-network surprise billing protections (No Surprises Act), submit a written grievance or call our billing advocates at (800) 555-0199 before October 15, 2026. Hardship fee reductions of up to 70% are available for households under 300% Federal Poverty Level.`,
  },
  {
    id: 'sample-insurance-cancellation',
    name: 'Auto Insurance Notice of Impending Cancellation',
    category: 'Insurance',
    badge: 'Impending Cutoff',
    hint: 'Insurance company will cancel coverage on Oct 20 unless proof of license reinstatement is submitted.',
    content: `SUMMIT MUTUAL INSURANCE COMPANY
Personal Auto Underwriting Division
PO Box 9200, Hartford, CT 06102
Policyholder Service: 1-888-555-3421

DATE MAILED: September 28, 2026
POLICY NUMBER: PA-77402-990
NAMED INSURED: Jordan Rivera
VEHICLE: 2023 Honda Civic EX (VIN: 1HGCR2F83PA019482)

NOTICE OF INTENT TO CANCEL COVERAGE
REASON FOR UNDERWRITING ACTION:
During routine state motor vehicle verification, the Department of Motor Vehicles flagged the primary operator license (ID: DL-8841029) as "Suspended - Pending Proof of Financial Responsibility". Under Section 4B of your policy, valid operator licensure is a condition precedent to comprehensive and collision coverage.

WHAT YOU MUST DO TO PREVENT CANCELLATION:
Submit certified documentation showing your driver license has been reinstated or cleared by the Department of Motor Vehicles.

FINAL ACTION DEADLINE:
October 20, 2026 at 12:01 AM Eastern Standard Time.

WHAT HAPPENS IF YOU DO NOT ACT:
Coverage under Policy PA-77402-990 will terminate automatically on October 20, 2026 at 12:01 AM EST. In accordance with State Transportation Law §312, notice of lapse in auto liability insurance will be transmitted directly to the State Department of Transportation, which may result in vehicle registration suspension and civil monetary penalties.

SUBMISSION INSTRUCTIONS:
Upload documents to: summit-mutual.com/verify or fax directly to Underwriting Desk 4 at (888) 555-3422. Reference Policy # PA-77402-990 on all pages.`,
  },
  {
    id: 'sample-lease-renewal',
    name: 'Apartment Lease Expiration & Rent Increase',
    category: 'Housing',
    badge: '60-Day Notice',
    hint: 'Requires written notice by Nov 30 to avoid automatic month-to-month rate jump of +$320/month.',
    content: `PARKSIDE OAKS RESIDENCES
Management Office: 820 Greenway Terrace, Suite 100
Contact: leasing@parkside-oaks.com | Tel: (555) 749-3300

DATE: October 01, 2026
TENANT(S): Taylor Brooks & Sam Brooks
UNIT: Apartment 4B
CURRENT LEASE EXPIRATION DATE: January 31, 2027

RE: LEASE RENEWAL OFFER & 60-DAY NOTICE REQUIREMENT

Dear Taylor & Sam,
Your existing fixed-term residential lease for Unit 4B expires on January 31, 2027. We would love to have you remain part of our community.

RENEWAL OPTIONS:
Option A: 12-Month Renewal (Feb 1, 2027 - Jan 31, 2028): $2,150.00/month (a modest $75/mo adjustment)
Option B: 6-Month Renewal: $2,295.00/month
Option C: Month-to-Month: $2,395.00/month (standard non-renewal rate)

ACTION REQUIRED BY NOVEMBER 30, 2026:
Under Section 18 of your lease agreement, both renewing tenants and vacating tenants are required to submit sixty (60) days advance written notice of their intention prior to lease expiration.

DEADLINE:
You must submit your signed Renewal Election Form or your Written Notice of Intent to Vacate no later than 5:00 PM on November 30, 2026.

IF YOU DO NOT RESPOND:
Failure to return a written election by November 30, 2026 will cause your tenancy to convert automatically to Month-to-Month status effective February 1, 2027 at the prevailing rate of $2,395.00/month (an increase of $320.00/month over your current rent), plus a monthly $50.00 non-lease administration surcharge.`,
  },
  {
    id: 'sample-warranty-solicitation',
    name: 'Home Protection Extended Warranty Solicitation',
    category: 'Warranty',
    badge: 'No Real Deadline',
    hint: 'Deceptive marketing notice designed to look like an urgent official expiration, with no legal obligation.',
    content: `NATIONAL HOME SECURITY & WARRANTY DIVISION
Records Department - Unit 401
NOTICE CODE: EXP-HOME-2026-904
RECIPIENT: Current Homeowner
PROPERTY ADDRESS: 1442 Elmwood Drive

FINAL NOTICE OF EXPIRATION - IMMEDIATE ACTION REQUESTED
Our automated property index indicates that the manufacturer factory mechanical warranty coverage on major home systems and appliances (HVAC, Water Heater, Electrical, Plumbing) for your residence at 1442 Elmwood Drive may have expired or is about to lapse.

REGISTRATION RECORD:
Customer Key: 90218-W
Status: Pending Customer Re-Authorization
Offer Code: SILVER-PROTECT-40

CALL IMMEDIATELY: 1-800-555-8941
Operating Hours: Mon-Sat 8am - 9pm EST

IMPORTANT DISCLOSURES:
This is a solicitation for an optional third-party home service contract administered by ShieldGuard Home Services LLC. You are under no legal obligation to purchase this contract. This communication is not affiliated with your mortgage lender, deed registry, municipal government, or original appliance manufacturers. Rates and coverages subject to underwriting inspection. If you choose not to enroll, your home systems will simply remain covered by whatever existing manufacturer warranty or personal insurance you currently maintain.`,
  },
  {
    id: 'sample-terms-update',
    name: 'Cloud Storage Terms of Service Modification',
    category: 'Contract / Agreement',
    badge: 'No Action Required',
    hint: 'Standard legal terms update with no deadline, no fees, and continued use implies acceptance.',
    content: `From: notifications@cloudsync-storage.com
Subject: Updates to our CloudSync Terms of Service and Privacy Policy
Date: October 01, 2026

Hello CloudSync Member,

We are writing to let you know that we are updating our Terms of Service and Privacy Policy, effective November 15, 2026.

What is changing?
1. Clarified data retention timelines for inactive free-tier accounts (now 180 days of inactivity before archival).
2. Enhanced European and California privacy disclosures regarding AI model training (CloudSync does not train generative AI models on private customer files).
3. Standardized arbitration and dispute resolution procedures for enterprise accounts.

What do you need to do?
No action is required on your part if you agree with these changes. Your continued use of CloudSync on or after November 15, 2026 signifies your acceptance of the updated terms.

If you do not agree with the updated terms, you may export your data and close your CloudSync account prior to November 15, 2026 by visiting your Account Settings > Privacy & Data > Export Archive.

Thank you for being a valued member of CloudSync.`,
  },
];
