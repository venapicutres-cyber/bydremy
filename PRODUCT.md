# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Couples purchasing and managing their own digital wedding invitation.
- bydreamy administrators who manage templates, payments, and customer support.

## Product Purpose

bydreamy lets a couple choose a wedding-invitation template, complete payment, then immediately manage a private copy of that invitation.

## Positioning

The selected template becomes an editable invitation owned by the paid customer rather than a request handled manually over chat.

## Operating Context

Customers browse templates on the public site, check out online, transfer manually to the owner's bank account, upload proof of transfer, and wait for admin verification. After admin confirms the funds have arrived, the customer receives an invitation email and can edit the invitation in the existing admin editor. Administrators manage templates, orders, and payment proofs in the same dashboard.

## Capabilities and Constraints

- A customer account is activated only after an admin verifies the uploaded proof and confirms the funds have arrived; DP does not grant editing access.
- Supabase Auth, Postgres RLS, Storage, and Edge Functions provide authentication, data access, private proof storage, and account provisioning.
- Payment is a manual bank transfer to account details configured by the admin in Pengaturan.
- Editors may access only the invitation assigned in their Auth app metadata.

## Brand Commitments

The product is branded bydreamy and sells digital wedding invitations.

## Evidence on Hand

- Existing React/Vite application, public catalogue, template detail route, admin editor, and Supabase schema in this repository.
- No production bank credentials or payment secrets are committed to the repository.

## Product Principles

- Keep the purchase path short and explicit.
- Never grant editing access before an admin approves the verified transfer server-side.
- Preserve strict one-invitation ownership for customer editors.
- Keep admin support and manual order visibility available.
