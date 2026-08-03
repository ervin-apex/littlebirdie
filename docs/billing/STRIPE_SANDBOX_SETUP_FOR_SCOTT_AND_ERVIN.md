# Little Birdee Stripe sandbox setup

**Purpose:** remove the billing-development blocker without enabling real payments or sharing account credentials.

**People involved:**

- **Scott:** owns the Stripe account for NO FAKE PLANTS PTY LTD.
- **Ervin:** receives Administrator access to the Little Birdee development sandbox only.

This setup does not charge customers, move money, or require a payout bank account. Stripe sandboxes use simulated payments.

## WhatsApp message for Scott

Copy and send the message below:

> Hey Scott, I need you to set up a Stripe development sandbox so I can build and test Little Birdee's $12 weekly subscription. The sandbox uses fake payments only. It won't charge anyone or give me access to the company's live money or bank account.
>
> Here is what I need you to do:
>
> 1. Sign in to Stripe, or create the Stripe account using an email address you or NO FAKE PLANTS PTY LTD controls. Please keep yourself as the account owner and turn on multi-factor authentication.
>
> 2. Complete Stripe's **Business profile**. Stripe won't let you invite me with the access needed for development until this is completed. Please use:
>    - Legal business name: **NO FAKE PLANTS PTY LTD**
>    - ABN: **19 653 257 151**
>    - Customer-facing product name: **Little Birdee**
>    - Industry: the closest option to **Software / SaaS**
>    - Website: **https://littlebirdie-gray.vercel.app**
>    - Description: **Weekly profit planning and daily revenue tracking software for Australian small service businesses.**
>    - A real support email address controlled by you or the company
>
>    If Stripe specifically asks for a registered business name or DBA, please use **NO FAKE PLANTS PTY LTD** for now because Little Birdee has not yet been registered as a business name.
>
> 3. Open the account picker at the top of Stripe, choose **Switch to sandbox**, and create a new sandbox called **Little Birdee Development**. Choose to create it from scratch if Stripe asks whether to copy an existing account.
>
> 4. Open **Little Birdee Development** and make sure Stripe shows the sandbox banner. This is important because my access must be attached to the sandbox, not the live account.
>
> 5. While you are inside that sandbox, go to **Settings → Team and security → Add member**. Invite **ervin@meetapex.ai** and choose **Administrator** for this specific sandbox.
>
> 6. Send me a quick message once the invitation has been sent. Please don't send me your Stripe password, verification code, API key or webhook secret—I won't need any of those from you.
>
> I need the sandbox access to connect Stripe securely to the app, create the $12/week GST-inclusive subscription, and test checkout, renewals, failed payments and cancellations without using real money. You don't need to add the payout bank account or activate live payments yet.

## Part 1 — Scott creates and owns the Stripe account

1. Go to [Stripe](https://dashboard.stripe.com/register) and create the account using an email address controlled by Scott or NO FAKE PLANTS PTY LTD.
2. Turn on multi-factor authentication when Stripe prompts for it.
3. Keep Scott as the account owner. Do not give Ervin the account password or authentication codes.
4. The account can be named **Little Birdee**, while the legal entity used for eventual live activation will be:
   - **Legal entity:** NO FAKE PLANTS PTY LTD
   - **ABN:** 19 653 257 151
5. Complete Stripe's **Business profile**. Stripe keeps the Developer and sandbox team roles locked until this profile is complete. Use:
   - **Legal business name:** NO FAKE PLANTS PTY LTD
   - **ABN:** 19 653 257 151
   - **Customer-facing product name:** Little Birdee
   - If Stripe specifically asks for a **registered business name** or **DBA**, use NO FAKE PLANTS PTY LTD until Little Birdee has been registered as a business name. Do not represent Little Birdee as already registered.
   - **Industry:** software / software as a service, using the closest option Stripe provides
   - **Product description:** Weekly profit planning and daily revenue tracking software for Australian small service businesses.
   - **Current website:** `https://littlebirdie-gray.vercel.app`
   - **Support contact:** a real email address controlled by Scott or the company
6. Completing the Business profile is required for team access, but Scott does not need to enter a payout bank account or finish live-payment activation merely to unblock sandbox development. Those steps can be completed before the commercial launch.

## Part 2 — Scott creates the development sandbox

1. Sign in to the Stripe Dashboard.
2. Open the account picker at the top of the Dashboard.
3. Open **Sandboxes** and create a new sandbox.
4. Name it **Little Birdee Development**.
5. Enter the sandbox and confirm that the Dashboard clearly identifies it as a sandbox rather than live mode.

The development sandbox must remain separate from the eventual live environment. Test customers, subscriptions and payments created here do not move real money.

## Part 3 — Scott invites Ervin to the sandbox

While **Little Birdee Development** is selected:

1. Open the account picker and select **Settings**.
2. Open **Team and security**.
3. Select **Add member** or **New member**.
4. Invite `ervin@meetapex.ai`.
5. Assign the **Administrator** role inside this specific sandbox.
6. Send the invitation.

Administrator access is being used to keep sandbox setup simple. It is acceptable here because the role is assigned inside the isolated development sandbox. Do not assign Ervin Administrator access from the live NO FAKE PLANTS PTY LTD account. Inviting Ervin from inside the specific sandbox avoids granting access to live payments or company banking information.

Scott should send Ervin only this confirmation:

> I created the Little Birdee Development Stripe sandbox and invited ervin@meetapex.ai with Administrator access inside the sandbox only.

Do not send passwords, API secret keys, webhook secrets or multi-factor authentication codes through email, WhatsApp or the project tracker.

## Part 4 — Ervin accepts and verifies access

1. Open the invitation sent by Stripe.
2. Sign in to an existing Stripe user account or create a personal Stripe login for `ervin@meetapex.ai`.
3. Turn on multi-factor authentication.
4. Accept the invitation.
5. Use Stripe's account picker to select **Little Birdee Development**.
6. Confirm all of the following:
   - the Dashboard says it is a sandbox;
   - Ervin can access developer settings;
   - there are no real customers, payments or payouts;
   - the live NO FAKE PLANTS PTY LTD account is not being used for testing.

If any live payment or payout information is visible unexpectedly, stop and confirm the selected Stripe environment before continuing.

## Part 5 — Ervin connects the sandbox to Vercel

Ervin completes this after the Stripe invitation has been accepted:

1. Open the Little Birdee project in Vercel.
2. Install or connect the official Stripe Marketplace integration.
3. When Stripe asks which environment to connect, select **Little Birdee Development**.
4. Connect it to the Vercel project serving `littlebirdie-gray.vercel.app`.
5. Provision sandbox credentials for the Development, Preview and Production deployment targets. The current Vercel production target is still a development preview for Scott, so it must continue using sandbox—not live—Stripe credentials.
6. Confirm that Vercel created the Stripe environment variables securely.
7. Redeploy the project after the variables have been added because environment-variable changes do not alter deployments that already exist.

Ervin must not copy secret keys into source files, documentation, screenshots, chat messages or Git. Secret values remain in Stripe, Vercel environment settings and the local untracked `.env.local` file when local testing requires them.

## Part 6 — Development configuration Ervin will create

Once the sandbox is connected, Ervin can create and test:

- Product: **Little Birdee**
- Price: **$12.00 AUD**
- Frequency: **weekly recurring**
- Tax behaviour: **GST-inclusive**
- Trial: **none**
- Quantity: **one subscription per business**, covering all its venues
- Stripe Checkout
- Stripe Billing Portal
- Signed webhook endpoint
- Subscription access control
- Cancellation at the end of the paid period
- Failed-payment locking and recovery
- End-of-access operational-data deletion

No real card details should ever be used in the sandbox. Stripe's documented test payment methods will be used during development and UAT.

## Completion checklist

The development blocker is resolved when every item below is true:

- [ ] Scott owns the Stripe account.
- [ ] Multi-factor authentication is enabled.
- [ ] **Little Birdee Development** exists as a sandbox.
- [ ] `ervin@meetapex.ai` has accepted Administrator access inside the sandbox only.
- [ ] Ervin can open the sandbox Developer Dashboard and manage its integration settings.
- [ ] The sandbox is connected to the Little Birdee Vercel project.
- [ ] Vercel has sandbox Stripe environment variables.
- [ ] The application has been redeployed after connection.
- [ ] No Stripe secrets have been committed or shared manually.
- [ ] No live Stripe environment is connected to the current build.

## Not required yet

These items do not block sandbox development:

- registering the Little Birdee business name;
- activating Stripe live mode;
- adding the payout bank account;
- completing live identity verification;
- entering a real payment card;
- creating live customers, products or prices;
- configuring the final Little Birdee domain.

They must be completed and verified before Little Birdee accepts real customer payments.

## Official references

- [Stripe: Manage sandbox access and API keys](https://docs.stripe.com/sandboxes/dashboard/manage-access)
- [Stripe: Invite team members or developers](https://support.stripe.com/questions/invite-team-members-or-developers-to-access-your-stripe-account)
- [Stripe: User roles](https://docs.stripe.com/get-started/account/teams/roles)
- [Stripe: Testing payments](https://docs.stripe.com/testing)
- [Vercel: Stripe Marketplace integration](https://vercel.com/marketplace/stripe)
- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)
