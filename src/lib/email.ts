import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendInviteEmail = async (
  to: string,
  inviteUrl: string,
  workspaceName: string,
  senderName: string
) => {
  const mailOptions = {
    from: `"${senderName} via FlowSphere" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Invitation: Join ${workspaceName} on FlowSphere`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Workspace Invitation</title>
    </head>
    <body style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: #8B5CF6; padding: 40px 0 60px; text-align: center; border-radius: 0 0 20% 20% / 30px;">
          <!-- Icon -->
          <div style="background-color: white; width: 60px; height: 60px; margin: 0 auto 20px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6H17V4C17 2.9 16.1 2 15 2H9C7.9 2 7 2.9 7 4V6H4C2.9 6 2 6.9 2 8V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V8C22 6.9 21.1 6 20 6ZM9 4H15V6H9V4ZM20 20H4V8H20V20Z" fill="#8B5CF6"/>
              <path d="M13 10H11V13H8V15H11V18H13V15H16V13H13V10Z" fill="#8B5CF6"/>
            </svg>
          </div>
          
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Join ${workspaceName}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
            You've been invited by ${senderName}
          </p>
        </div>

        <!-- Content Area -->
        <div style="padding: 30px;">
          <!-- Intro Message -->
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; color: #4B5563; line-height: 1.6;">
              Hi there! 👋
            </p>
            <p style="margin: 0; font-size: 16px; color: #4B5563; line-height: 1.6;">
              ${senderName} has invited you to collaborate on the <span style="font-weight: 600; color: #8B5CF6;">${workspaceName}</span> workspace. 
              Join now to start collaborating with the team!
            </p>
          </div>
          
          <!-- Workspace Card -->
          <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #E5E7EB;">
            <!-- Workspace Title -->
            <div style="margin-bottom: 20px;">
              <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px; font-weight: 600;">${workspaceName}</h2>
              <div style="display: inline-block; padding: 2px 10px; background-color: #F5F3FF; color: #8B5CF6; border-radius: 999px; font-size: 12px; font-weight: 500;">INVITATION</div>
            </div>
            
            <!-- Workspace Details -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Invited by</td>
                <td style="padding: 8px 0; color: #111827;">${senderName}</td>
              </tr>
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Workspace</td>
                <td style="padding: 8px 0; color: #111827;">${workspaceName}</td>
              </tr>
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Platform</td>
                <td style="padding: 8px 0; color: #111827;">FlowSphere</td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background: #8B5CF6; color: white; font-weight: 600; font-size: 16px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              Accept Invitation
            </a>
          </div>

          <!-- Alternative Link -->
          <div style="text-align: center; margin-top: 16px;">
            <p style="font-size: 14px; color: #6B7280; margin: 0 0 5px 0;">
              Or copy this link:
            </p>
            <a href="${inviteUrl}" style="color: #8B5CF6; font-size: 14px; text-decoration: none; word-break: break-all; font-weight: 500;">
              ${inviteUrl}
            </a>
          </div>
          </div>

          <!-- Footer -->
        <div style="padding: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
          <p style="font-size: 13px; color: #9CA3AF; margin: 0; line-height: 1.5;">
              This invitation was sent through FlowSphere.<br>
              If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendTaskAssignmentEmail = async (
  to: string,
  taskName: string,
  taskLink: string,
  dueDate: string,
  projectName: string,
  workspaceName: string,
  status: string,
  senderName: string
) => {
  // Format the due date to be more readable
  const formattedDueDate = new Date(dueDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"${senderName} via FlowSphere" <${process.env.GMAIL_USER}>`,
    to,
    subject: `New Task Assigned: ${taskName}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Task Assignment</title>
    </head>
    <body style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: #5B5FEF; padding: 40px 0 60px; text-align: center; border-radius: 0 0 20% 20% / 30px;">
          <!-- Icon -->
          <div style="background-color: white; width: 60px; height: 60px; margin: 0 auto 20px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3ZM14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="#C56917"/>
            </svg>
          </div>
          
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">New Task Assigned</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
            ${senderName} has assigned you a task
          </p>
        </div>

        <!-- Content Area -->
        <div style="padding: 30px;">
          <!-- Intro Message -->
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; color: #4B5563; line-height: 1.6;">
              Hi there! 👋
            </p>
            <p style="margin: 0; font-size: 16px; color: #4B5563; line-height: 1.6;">
              You have been assigned a new task in the <span style="font-weight: 600; color: #5B5FEF;">${workspaceName}</span> workspace.
              Here are the details:
            </p>
          </div>
          
          <!-- Task Card -->
          <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #E5E7EB;">
            <!-- Task Title -->
            <div style="margin-bottom: 20px;">
              <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px; font-weight: 600;">${taskName}</h2>
              <div style="display: inline-block; padding: 2px 10px; background-color: #EEF2FF; color: #6366F1; border-radius: 999px; font-size: 12px; font-weight: 500;">${status}</div>
            </div>
            
            <!-- Task Details -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Project</td>
                <td style="padding: 8px 0; color: #111827;">${projectName}</td>
              </tr>
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Due Date</td>
                <td style="padding: 8px 0; color: #111827;">
                  <span style="display: inline-flex; align-items: center;">
                    📅 ${formattedDueDate}
                  </span>
                </td>
              </tr>
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Workspace</td>
                <td style="padding: 8px 0; color: #111827;">${workspaceName}</td>
              </tr>
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Assigned by</td>
                <td style="padding: 8px 0; color: #111827;">${senderName}</td>
              </tr>
            </table>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskLink}" style="display: inline-block; background: #5B5FEF; color: white; font-weight: 600; font-size: 16px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Task Details
            </a>
          </div>
          
          <!-- Alternative Link -->
          <div style="text-align: center; margin-top: 16px;">
            <p style="font-size: 14px; color: #6B7280; margin: 0 0 5px 0;">
              Or copy this link:
            </p>
            <a href="${taskLink}" style="color: #5B5FEF; font-size: 14px; text-decoration: none; word-break: break-all; font-weight: 500;">
              ${taskLink}
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
          <p style="font-size: 13px; color: #9CA3AF; margin: 0; line-height: 1.5;">
            This notification was sent automatically from FlowSphere.<br>
            You received this email because you're a member of the ${workspaceName} workspace.
          </p>
        </div>
      </div>
    </body>
    </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendTaskUnassignmentEmail = async (
  to: string,
  taskName: string,
  taskLink: string,
  newAssigneeName: string,
  projectName: string,
  workspaceName: string,
  senderName: string
) => {
  const mailOptions = {
    from: `"${senderName} via FlowSphere" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Task Reassigned: ${taskName}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Reassigned</title>
    </head>
    <body style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: #6B7280; padding: 40px 0 60px; text-align: center; border-radius: 0 0 20% 20% / 30px;">
          <!-- Icon -->
          <div style="background-color: white; width: 60px; height: 60px; margin: 0 auto 20px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.99 17H20V19H7.99V22L4 18L7.99 14V17Z" fill="#6B7280"/>
              <path d="M16.01 8H4V10H16.01V13L20 9L16.01 5V8Z" fill="#6B7280"/>
            </svg>
          </div>
          
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">Task Reassigned</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
            ${senderName} has reassigned this task
          </p>
        </div>

        <!-- Content Area -->
        <div style="padding: 30px;">
          <!-- Intro Message -->
          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 16px; font-size: 16px; color: #4B5563; line-height: 1.6;">
              Hi there! 👋
            </p>
            <p style="margin: 0; font-size: 16px; color: #4B5563; line-height: 1.6;">
              The task <strong>${taskName}</strong> in the <span style="font-weight: 600; color: #6B7280;">${workspaceName}</span> workspace has been reassigned to <span style="font-weight: 600; color: #3B82F6;">${newAssigneeName}</span>. You are no longer responsible for this task.
            </p>
          </div>
          
          <!-- Task Card -->
          <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #E5E7EB;">
            <!-- Task Title -->
            <div style="margin-bottom: 20px;">
              <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px; font-weight: 600;">${taskName}</h2>
              <div style="display: inline-block; padding: 2px 10px; background-color: #F3F4F6; color: #6B7280; border-radius: 999px; font-size: 12px; font-weight: 500;">REASSIGNED</div>
            </div>
            
            <!-- Task Details -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Project</td>
                <td style="padding: 8px 0; color: #111827;">${projectName}</td>
              </tr>
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Workspace</td>
                <td style="padding: 8px 0; color: #111827;">${workspaceName}</td>
              </tr>
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">Reassigned by</td>
                <td style="padding: 8px 0; color: #111827;">${senderName}</td>
              </tr>
              <tr>
                <td width="120" style="padding: 8px 0; color: #6B7280; font-weight: 500;">New Assignee</td>
                <td style="padding: 8px 0; color: #3B82F6; font-weight: 500;">${newAssigneeName}</td>
              </tr>
            </table>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${taskLink}" style="display: inline-block; background: #6B7280; color: white; font-weight: 600; font-size: 16px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Task Details
            </a>
      </div>

          <!-- Alternative Link -->
          <div style="text-align: center; margin-top: 16px;">
            <p style="font-size: 14px; color: #6B7280; margin: 0 0 5px 0;">
              Or copy this link:
            </p>
            <a href="${taskLink}" style="color: #6B7280; font-size: 14px; text-decoration: none; word-break: break-all; font-weight: 500;">
              ${taskLink}
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
          <p style="font-size: 13px; color: #9CA3AF; margin: 0; line-height: 1.5;">
            This notification was sent automatically from FlowSphere.<br>
            You received this email because you were previously assigned to this task.
        </p>
      </div>
    </div>
    </body>
    </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
