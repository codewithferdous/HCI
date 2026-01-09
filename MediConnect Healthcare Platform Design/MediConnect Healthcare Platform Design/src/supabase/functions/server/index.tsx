import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Supabase admin client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Initialize storage buckets on startup
async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const documentsExists = buckets?.some(b => b.name === 'make-6a2478ef-documents');
    if (!documentsExists) {
      await supabase.storage.createBucket('make-6a2478ef-documents', { public: true });
      console.log('✅ Created documents bucket');
    }
    
    const reportsExists = buckets?.some(b => b.name === 'make-6a2478ef-reports');
    if (!reportsExists) {
      await supabase.storage.createBucket('make-6a2478ef-reports', { public: true });
      console.log('✅ Created reports bucket');
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
  }
}

initializeStorage();

// ========================================
// AUTH ROUTES
// ========================================

// Sign up
app.post('/make-server-6a2478ef/auth/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role } = body;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true, // Auto-confirm since email server not configured
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Determine initial status
    const status = role === 'patient' ? 'approved' : 'pending';

    // Store user data in KV
    const userId = authData.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role,
      status,
      createdAt: new Date().toISOString(),
    });

    // Create audit log
    await kv.set(`audit:${Date.now()}:signup`, {
      action: 'signup',
      userId,
      userEmail: email,
      role,
      timestamp: new Date().toISOString(),
    });

    return c.json({
      success: true,
      user: authData.user,
      status,
      needsApproval: status === 'pending',
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ error: error.message || 'Signup failed' }, 500);
  }
});

// Sign in
app.post('/make-server-6a2478ef/auth/signin', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Auth signin error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Get user data from KV
    const userData = await kv.get(`user:${data.user.id}`);
    
    if (!userData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Check approval status for doctors and assistants
    if ((userData.role === 'doctor' || userData.role === 'assistant') && userData.status !== 'approved') {
      if (userData.status === 'pending') {
        return c.json({ error: 'Your account is pending admin approval' }, 403);
      }
      if (userData.status === 'rejected') {
        return c.json({ error: 'Your account has been rejected' }, 403);
      }
    }

    return c.json({
      success: true,
      accessToken: data.session.access_token,
      user: userData,
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    return c.json({ error: error.message || 'Signin failed' }, 500);
  }
});

// Get current user
app.get('/make-server-6a2478ef/auth/me', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    return c.json({ user: userData });
  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Sign out
app.post('/make-server-6a2478ef/auth/signout', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (accessToken) {
      await supabase.auth.admin.signOut(accessToken);
    }
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Signout error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// USER MANAGEMENT ROUTES
// ========================================

// Get all users (for admin)
app.get('/make-server-6a2478ef/users/all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    return c.json({ users: allUsers });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get pending users (for admin)
app.get('/make-server-6a2478ef/users/pending', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    const pendingUsers = allUsers.filter((u: any) => u.status === 'pending');

    return c.json({ users: pendingUsers });
  } catch (error: any) {
    console.error('Get pending users error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Approve user
app.post('/make-server-6a2478ef/users/approve', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { userId } = await c.req.json();
    const targetUser = await kv.get(`user:${userId}`);
    
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user status
    await kv.set(`user:${userId}`, {
      ...targetUser,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: user.id,
    });

    // Create audit log
    await kv.set(`audit:${Date.now()}:approve`, {
      action: 'approve_user',
      performedBy: user.id,
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send approval email (requires email service configuration)
    // For now, we'll just log it
    console.log(`✅ Approved user: ${targetUser.email}`);

    return c.json({ success: true, message: 'User approved' });
  } catch (error: any) {
    console.error('Approve user error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Reject user
app.post('/make-server-6a2478ef/users/reject', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { userId, reason } = await c.req.json();
    const targetUser = await kv.get(`user:${userId}`);
    
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update user status
    await kv.set(`user:${userId}`, {
      ...targetUser,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: user.id,
      rejectionReason: reason || null,
    });

    // Create audit log
    await kv.set(`audit:${Date.now()}:reject`, {
      action: 'reject_user',
      performedBy: user.id,
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      rejectionReason: reason || null,
      timestamp: new Date().toISOString(),
    });

    console.log(`❌ Rejected user: ${targetUser.email}`);

    return c.json({ success: true, message: 'User rejected' });
  } catch (error: any) {
    console.error('Reject user error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// ASSISTANT SEARCH ROUTES
// ========================================

// Search assistants
app.get('/make-server-6a2478ef/assistants/search', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const area = c.req.query('area');
    const name = c.req.query('name');

    const allUsers = await kv.getByPrefix('user:');
    let assistants = allUsers.filter((u: any) => 
      u.role === 'assistant' && u.status === 'approved'
    );

    // Apply filters
    if (area) {
      assistants = assistants.filter((a: any) => 
        a.area?.toLowerCase().includes(area.toLowerCase())
      );
    }
    if (name) {
      assistants = assistants.filter((a: any) => 
        a.name?.toLowerCase().includes(name.toLowerCase())
      );
    }

    return c.json({ assistants });
  } catch (error: any) {
    console.error('Search assistants error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// REQUEST ROUTES
// ========================================

// Send request to assistant
app.post('/make-server-6a2478ef/requests/send', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'patient') {
      return c.json({ error: 'Only patients can send requests' }, 403);
    }

    const { assistantId } = await c.req.json();
    const assistant = await kv.get(`user:${assistantId}`);
    
    if (!assistant || assistant.role !== 'assistant') {
      return c.json({ error: 'Assistant not found' }, 404);
    }

    const requestId = `req:${Date.now()}:${user.id}`;
    const request = {
      id: requestId,
      patientId: user.id,
      patientName: currentUser.name,
      assistantId,
      assistantName: assistant.name,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    await kv.set(requestId, request);

    // Create audit log
    await kv.set(`audit:${Date.now()}:request`, {
      action: 'send_request',
      performedBy: user.id,
      requestId,
      assistantId,
      timestamp: new Date().toISOString(),
    });

    return c.json({ success: true, request });
  } catch (error: any) {
    console.error('Send request error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get my requests (patient)
app.get('/make-server-6a2478ef/requests/my-requests', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allRequests = await kv.getByPrefix('req:');
    const myRequests = allRequests.filter((r: any) => r.patientId === user.id);

    return c.json({ requests: myRequests });
  } catch (error: any) {
    console.error('Get my requests error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get requests for assistant
app.get('/make-server-6a2478ef/requests/for-assistant', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allRequests = await kv.getByPrefix('req:');
    const assistantRequests = allRequests.filter((r: any) => r.assistantId === user.id);

    return c.json({ requests: assistantRequests });
  } catch (error: any) {
    console.error('Get assistant requests error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Accept request
app.post('/make-server-6a2478ef/requests/accept', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'assistant') {
      return c.json({ error: 'Only assistants can accept requests' }, 403);
    }

    const { requestId, scheduledDate } = await c.req.json();
    const request = await kv.get(requestId);
    
    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    if (request.assistantId !== user.id) {
      return c.json({ error: 'Not authorized to accept this request' }, 403);
    }

    const updatedRequest = {
      ...request,
      status: 'accepted',
      scheduledDate,
      acceptedAt: new Date().toISOString(),
    };

    await kv.set(requestId, updatedRequest);

    // Create audit log
    await kv.set(`audit:${Date.now()}:accept`, {
      action: 'accept_request',
      performedBy: user.id,
      requestId,
      timestamp: new Date().toISOString(),
    });

    return c.json({ success: true, request: updatedRequest });
  } catch (error: any) {
    console.error('Accept request error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Cancel request
app.post('/make-server-6a2478ef/requests/cancel', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { requestId } = await c.req.json();
    const request = await kv.get(requestId);
    
    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    if (request.patientId !== user.id) {
      return c.json({ error: 'Not authorized to cancel this request' }, 403);
    }

    const updatedRequest = {
      ...request,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    };

    await kv.set(requestId, updatedRequest);

    return c.json({ success: true, request: updatedRequest });
  } catch (error: any) {
    console.error('Cancel request error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// REPORT ROUTES
// ========================================

// Upload report
app.post('/make-server-6a2478ef/reports/upload', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'assistant') {
      return c.json({ error: 'Only assistants can upload reports' }, 403);
    }

    const body = await c.req.json();
    const { requestId, medicalData } = body;

    const request = await kv.get(requestId);
    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    if (request.assistantId !== user.id) {
      return c.json({ error: 'Not authorized to upload report for this request' }, 403);
    }

    // Update request status
    const updatedRequest = {
      ...request,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    await kv.set(requestId, updatedRequest);

    // Create report
    const reportId = `report:${Date.now()}:${requestId}`;
    const report = {
      id: reportId,
      requestId,
      patientId: request.patientId,
      patientName: request.patientName,
      assistantId: user.id,
      assistantName: currentUser.name,
      status: 'pending',
      medicalData,
      uploadedAt: new Date().toISOString(),
    };

    await kv.set(reportId, report);

    // Create audit log
    await kv.set(`audit:${Date.now()}:upload`, {
      action: 'upload_report',
      performedBy: user.id,
      reportId,
      requestId,
      timestamp: new Date().toISOString(),
    });

    return c.json({ success: true, report });
  } catch (error: any) {
    console.error('Upload report error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get pending reports (for doctors)
app.get('/make-server-6a2478ef/reports/pending', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'doctor') {
      return c.json({ error: 'Only doctors can view reports' }, 403);
    }

    const allReports = await kv.getByPrefix('report:');
    const pendingReports = allReports.filter((r: any) => r.status === 'pending');

    return c.json({ reports: pendingReports });
  } catch (error: any) {
    console.error('Get pending reports error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get reviewed reports (for doctors)
app.get('/make-server-6a2478ef/reports/reviewed', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'doctor') {
      return c.json({ error: 'Only doctors can view reports' }, 403);
    }

    const allReviews = await kv.getByPrefix('review:');
    const myReviews = allReviews.filter((r: any) => r.doctorId === user.id);

    return c.json({ reviews: myReviews });
  } catch (error: any) {
    console.error('Get reviewed reports error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get reports for assistant
app.get('/make-server-6a2478ef/reports/my-uploads', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allReports = await kv.getByPrefix('report:');
    const myReports = allReports.filter((r: any) => r.assistantId === user.id);

    return c.json({ reports: myReports });
  } catch (error: any) {
    console.error('Get my uploads error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get reviewed reports for patient
app.get('/make-server-6a2478ef/reports/my-reviews', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allReviews = await kv.getByPrefix('review:');
    const myReviews = allReviews.filter((r: any) => r.patientId === user.id);

    return c.json({ reviews: myReviews });
  } catch (error: any) {
    console.error('Get my reviews error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// REVIEW ROUTES
// ========================================

// Create review
app.post('/make-server-6a2478ef/reviews/create', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'doctor') {
      return c.json({ error: 'Only doctors can create reviews' }, 403);
    }

    const body = await c.req.json();
    const { reportId, diagnosis, prescription, advice } = body;

    const report = await kv.get(reportId);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    // Update report status
    const updatedReport = {
      ...report,
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      reviewedBy: user.id,
    };
    await kv.set(reportId, updatedReport);

    // Create review
    const reviewId = `review:${Date.now()}:${reportId}`;
    const review = {
      id: reviewId,
      reportId,
      patientId: report.patientId,
      patientName: report.patientName,
      doctorId: user.id,
      doctorName: currentUser.name,
      diagnosis,
      prescription,
      advice,
      createdAt: new Date().toISOString(),
    };

    await kv.set(reviewId, review);

    // Create audit log
    await kv.set(`audit:${Date.now()}:review`, {
      action: 'create_review',
      performedBy: user.id,
      reviewId,
      reportId,
      timestamp: new Date().toISOString(),
    });

    return c.json({ success: true, review });
  } catch (error: any) {
    console.error('Create review error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// AUDIT LOG ROUTES
// ========================================

// Get audit logs (admin only)
app.get('/make-server-6a2478ef/audit/logs', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentUser = await kv.get(`user:${user.id}`);
    if (currentUser?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const logs = await kv.getByPrefix('audit:');
    
    // Sort by timestamp descending
    logs.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ logs });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// DOCUMENT UPLOAD ROUTE
// ========================================

// Upload verification document during signup (no auth required, uses userId)
app.post('/make-server-6a2478ef/documents/upload-signup', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('document') as File;
    const userId = formData.get('userId') as string;
    
    if (!file || !userId) {
      return c.json({ error: 'File and userId required' }, 400);
    }

    // Wait a bit and verify user exists (allow time for KV store to sync)
    let user = await kv.get(`user:${userId}`);
    let retries = 5; // Increased retries
    while (!user && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Increased wait time
      user = await kv.get(`user:${userId}`);
      retries--;
      console.log(`Retry ${5 - retries}: Looking for user ${userId}...`);
    }

    if (!user) {
      console.error(`User ${userId} not found in KV store after ${5} retries`);
      // Try to get user from auth directly as fallback
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        if (authUser?.user) {
          // Create user record if it doesn't exist
          await kv.set(`user:${userId}`, {
            id: userId,
            email: authUser.user.email,
            name: authUser.user.user_metadata?.name || 'Unknown',
            role: authUser.user.user_metadata?.role || 'unknown',
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
          user = await kv.get(`user:${userId}`);
        }
      } catch (authError) {
        console.error('Auth fallback error:', authError);
      }
      
      if (!user) {
        return c.json({ error: 'User not found. Please try signing up again.' }, 404);
      }
    }

    if (user.status !== 'pending') {
      console.warn(`User ${userId} is not in pending status: ${user.status}`);
      // Still allow upload if user exists
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return c.json({ error: 'File size exceeds 10MB limit' }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      return c.json({ error: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' }, 400);
    }

    // Upload to storage
    const fileName = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-6a2478ef-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Document upload error:', uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('make-6a2478ef-documents')
      .getPublicUrl(fileName);

    // Store document metadata
    const documentData = {
      userId: userId,
      fileName: file.name,
      filePath: fileName,
      publicUrl,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      fileType: file.type,
    };
    
    await kv.set(`document:${userId}`, documentData);
    console.log(`✅ Document stored for user ${userId}: ${file.name}`);

    return c.json({ 
      success: true, 
      documentUrl: publicUrl,
      document: documentData
    });
  } catch (error: any) {
    console.error('Upload document error:', error);
    return c.json({ error: error.message || 'Document upload failed' }, 500);
  }
});

// Upload verification document
app.post('/make-server-6a2478ef/documents/upload', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('document') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Upload to storage
    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-6a2478ef-documents')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Document upload error:', uploadError);
      return c.json({ error: uploadError.message }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('make-6a2478ef-documents')
      .getPublicUrl(fileName);

    // Store document metadata
    await kv.set(`document:${user.id}`, {
      userId: user.id,
      fileName: file.name,
      filePath: fileName,
      publicUrl,
      uploadedAt: new Date().toISOString(),
    });

    return c.json({ success: true, documentUrl: publicUrl });
  } catch (error: any) {
    console.error('Upload document error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get document for user
app.get('/make-server-6a2478ef/documents/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    const document = await kv.get(`document:${userId}`);

    return c.json({ document });
  } catch (error: any) {
    console.error('Get document error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// SETTINGS ROUTES
// ========================================

// Update profile
app.post('/make-server-6a2478ef/settings/update-profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, phone, area, specialization } = await c.req.json();
    const currentUser = await kv.get(`user:${user.id}`);

    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updatedUser = {
      ...currentUser,
      name: name || currentUser.name,
      phone: phone || currentUser.phone,
      area: area || currentUser.area,
      specialization: specialization || currentUser.specialization,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${user.id}`, updatedUser);

    return c.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Change password
app.post('/make-server-6a2478ef/settings/change-password', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { newPassword } = await c.req.json();

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password change error:', updateError);
      return c.json({ error: updateError.message }, 400);
    }

    return c.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return c.json({ error: error.message }, 500);
  }
});

console.log('🚀 MediConnect server started');
Deno.serve(app.fetch);
