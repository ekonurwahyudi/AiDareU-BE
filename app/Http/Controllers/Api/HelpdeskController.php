<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Helpdesk;
use App\Models\HelpdeskDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class HelpdeskController extends Controller
{
    /**
     * Get all tickets for authenticated user (or all tickets if superadmin)
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            $query = Helpdesk::with(['user', 'details' => function($q) {
                $q->latest()->take(1);
            }]);

            // Check if user is superadmin - if not, filter by user_id
            $isSuperadmin = $user->hasRole('superadmin');

            if (!$isSuperadmin) {
                $query->where('user_id', $user->id);
            }

            $query->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status')) {
                if ($request->status === 'closed') {
                    $query->closed();
                } else {
                    $query->open();
                }
            }

            $tickets = $query->get();

            // Add latest_update to each ticket
            $tickets->each(function ($ticket) {
                $latestDetail = $ticket->details->first();
                $ticket->latest_update = $latestDetail ? $latestDetail->created_at : $ticket->updated_at;
                unset($ticket->details);
            });

            return response()->json([
                'success' => true,
                'data' => $tickets,
                'is_superadmin' => $isSuperadmin
            ])->header('Cache-Control', 'no-cache, no-store, must-revalidate')
              ->header('Pragma', 'no-cache')
              ->header('Expires', '0');
        } catch (\Exception $e) {
            Log::error('Error fetching helpdesk tickets', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tickets'
            ], 500);
        }
    }

    /**
     * Get single ticket detail with all messages
     */
    public function show($identifier)
    {
        try {
            $user = Auth::user();
            $isSuperadmin = $user->hasRole('superadmin');

            $query = Helpdesk::with(['user', 'details.user']);

            // Check if identifier is UUID or ticket number
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
                $query->where('uuid', $identifier);
            } else {
                $query->where('ticket_number', $identifier);
            }

            // If not superadmin, must be ticket owner
            if (!$isSuperadmin) {
                $query->where('user_id', $user->id);
            }

            $ticket = $query->first();

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found'
                ], 404);
            }

            // Order details by creation time
            $ticket->details = $ticket->details->sortBy('created_at')->values();

            return response()->json([
                'success' => true,
                'data' => $ticket,
                'is_superadmin' => $isSuperadmin
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching ticket detail', [
                'identifier' => $identifier,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ticket detail'
            ], 500);
        }
    }

    /**
     * Create new helpdesk ticket
     */
    public function store(Request $request)
    {
        try {
            // Validation with security measures
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'department' => 'required|in:Support IT,Sales/Billing,Abuse',
                'category' => 'required|string|max:100',
                'priority' => 'required|in:low,medium,high',
                'message' => 'required|string|max:10000',
                'attachment' => 'nullable|file|max:30720|mimes:jpg,jpeg,gif,png,zip,gz,txt,pdf', // Max 30MB
            ], [
                'title.required' => 'Judul harus diisi',
                'title.max' => 'Judul maksimal 255 karakter',
                'department.required' => 'Department harus dipilih',
                'department.in' => 'Department tidak valid',
                'category.required' => 'Kategori harus diisi',
                'category.max' => 'Kategori maksimal 100 karakter',
                'priority.required' => 'Priority harus dipilih',
                'priority.in' => 'Priority tidak valid',
                'message.required' => 'Pesan harus diisi',
                'message.max' => 'Pesan maksimal 10000 karakter',
                'attachment.file' => 'File tidak valid',
                'attachment.max' => 'Ukuran file maksimal 30MB',
                'attachment.mimes' => 'Format file harus: jpg, jpeg, gif, png, zip, gz, txt, pdf',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();

            DB::beginTransaction();

            // Create ticket
            $ticket = Helpdesk::create([
                'user_id' => $user->id,
                'title' => strip_tags($request->title), // Strip HTML tags for security
                'category' => strip_tags($request->category),
                'department' => $request->department,
                'priority' => $request->priority,
                'status' => 'open',
            ]);

            // Handle file upload if exists
            $fileData = null;
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');

                // Additional security check for file content
                $mimeType = $file->getMimeType();
                $allowedMimes = [
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                    'application/zip', 'application/x-gzip', 'application/gzip',
                    'text/plain', 'application/pdf'
                ];

                if (!in_array($mimeType, $allowedMimes)) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'File type not allowed'
                    ], 422);
                }

                // Generate safe filename
                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                $safeName = pathinfo($originalName, PATHINFO_FILENAME);
                $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $safeName);
                $fileName = $safeName . '_' . time() . '.' . $extension;

                // Store in helpdesk folder
                $path = $file->storeAs('helpdesk/' . $ticket->uuid, $fileName, 'public');

                $fileData = [
                    'file_path' => $path,
                    'file_name' => $originalName,
                    'file_type' => $mimeType,
                    'file_size' => $file->getSize(),
                ];
            }

            // Create first detail/message - include helpdesk_uuid for better data sync
            $detail = HelpdeskDetail::create([
                'helpdesk_id' => $ticket->id,
                'helpdesk_uuid' => $ticket->uuid,
                'user_id' => $user->id,
                'message' => strip_tags($request->message, '<p><br><b><i><u><ul><ol><li><a>'), // Allow some safe HTML tags
                'type' => 'question',
                'file_path' => $fileData['file_path'] ?? null,
                'file_name' => $fileData['file_name'] ?? null,
                'file_type' => $fileData['file_type'] ?? null,
                'file_size' => $fileData['file_size'] ?? null,
            ]);

            DB::commit();

            // Load relationships
            $ticket->load(['user', 'details']);

            Log::info('Helpdesk ticket created', [
                'ticket_number' => $ticket->ticket_number,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ticket berhasil dibuat',
                'data' => $ticket
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error creating helpdesk ticket', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create ticket'
            ], 500);
        }
    }

    /**
     * Reply to a ticket
     */
    public function reply(Request $request, $identifier)
    {
        try {
            $validator = Validator::make($request->all(), [
                'message' => 'required|string|max:10000',
                'attachment' => 'nullable|file|max:30720|mimes:jpg,jpeg,gif,png,zip,gz,txt,pdf',
            ], [
                'message.required' => 'Pesan harus diisi',
                'message.max' => 'Pesan maksimal 10000 karakter',
                'attachment.file' => 'File tidak valid',
                'attachment.max' => 'Ukuran file maksimal 30MB',
                'attachment.mimes' => 'Format file harus: jpg, jpeg, gif, png, zip, gz, txt, pdf',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $isSuperadmin = $user->hasRole('superadmin');

            $query = Helpdesk::query();

            // Check if identifier is UUID or ticket number
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
                $query->where('uuid', $identifier);
            } else {
                $query->where('ticket_number', $identifier);
            }

            // If not superadmin, must be ticket owner
            if (!$isSuperadmin) {
                $query->where('user_id', $user->id);
            }

            $ticket = $query->first();

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found'
                ], 404);
            }

            if ($ticket->status === 'closed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot reply to closed ticket'
                ], 400);
            }

            DB::beginTransaction();

            // Handle file upload if exists
            $fileData = null;
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');

                $mimeType = $file->getMimeType();
                $allowedMimes = [
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                    'application/zip', 'application/x-gzip', 'application/gzip',
                    'text/plain', 'application/pdf'
                ];

                if (!in_array($mimeType, $allowedMimes)) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'File type not allowed'
                    ], 422);
                }

                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                $safeName = pathinfo($originalName, PATHINFO_FILENAME);
                $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $safeName);
                $fileName = $safeName . '_' . time() . '.' . $extension;

                $path = $file->storeAs('helpdesk/' . $ticket->uuid, $fileName, 'public');

                $fileData = [
                    'file_path' => $path,
                    'file_name' => $originalName,
                    'file_type' => $mimeType,
                    'file_size' => $file->getSize(),
                ];
            }

            // Create reply - include helpdesk_uuid for better data sync
            $detail = HelpdeskDetail::create([
                'helpdesk_id' => $ticket->id,
                'helpdesk_uuid' => $ticket->uuid,
                'user_id' => $user->id,
                'message' => strip_tags($request->message, '<p><br><b><i><u><ul><ol><li><a>'),
                'type' => $isSuperadmin ? 'answer' : 'question',
                'pic' => $isSuperadmin ? $user->name : null,
                'file_path' => $fileData['file_path'] ?? null,
                'file_name' => $fileData['file_name'] ?? null,
                'file_type' => $fileData['file_type'] ?? null,
                'file_size' => $fileData['file_size'] ?? null,
            ]);

            // Status is now managed manually by superadmin, no auto-update on reply

            DB::commit();

            $detail->load('user');

            Log::info('Helpdesk ticket reply added', [
                'ticket_number' => $ticket->ticket_number,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Balasan berhasil dikirim',
                'data' => $detail
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error replying to ticket', [
                'identifier' => $identifier,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send reply'
            ], 500);
        }
    }

    /**
     * Reopen a closed ticket
     */
    public function reopen($identifier)
    {
        try {
            $user = Auth::user();

            $query = Helpdesk::where('user_id', $user->id);

            // Check if identifier is UUID or ticket number
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
                $query->where('uuid', $identifier);
            } else {
                $query->where('ticket_number', $identifier);
            }

            $ticket = $query->first();

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found'
                ], 404);
            }

            if ($ticket->status !== 'closed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket is not closed'
                ], 400);
            }

            $ticket->update(['status' => 'open']);

            Log::info('Helpdesk ticket reopened', [
                'ticket_number' => $ticket->ticket_number,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ticket berhasil dibuka kembali',
                'data' => $ticket
            ]);

        } catch (\Exception $e) {
            Log::error('Error reopening ticket', [
                'identifier' => $identifier,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reopen ticket'
            ], 500);
        }
    }

    /**
     * Update ticket status (superadmin only)
     */
    public function updateStatus(Request $request, $identifier)
    {
        try {
            $user = Auth::user();

            // Check if user is superadmin
            if (!$user->hasRole('superadmin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only superadmin can update ticket status.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:open,in_progress,closed',
            ], [
                'status.required' => 'Status harus diisi',
                'status.in' => 'Status tidak valid. Pilih: open, in_progress, atau closed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = Helpdesk::query();

            // Check if identifier is UUID or ticket number
            if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $identifier)) {
                $query->where('uuid', $identifier);
            } else {
                $query->where('ticket_number', $identifier);
            }

            $ticket = $query->first();

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found'
                ], 404);
            }

            $oldStatus = $ticket->status;
            $newStatus = $request->status;

            $ticket->update(['status' => $newStatus]);

            Log::info('Helpdesk ticket status updated by superadmin', [
                'ticket_number' => $ticket->ticket_number,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'updated_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status tiket berhasil diubah',
                'data' => $ticket
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating ticket status', [
                'identifier' => $identifier,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update ticket status'
            ], 500);
        }
    }
}
