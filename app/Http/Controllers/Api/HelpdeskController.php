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
            ]);
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
    public function show($ticketNumber)
    {
        try {
            $user = Auth::user();
            $isSuperadmin = $user->hasRole('superadmin');

            $query = Helpdesk::with(['user', 'details.user'])
                ->where('ticket_number', $ticketNumber);

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
                'ticket_number' => $ticketNumber,
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

            // Create first detail/message
            $detail = HelpdeskDetail::create([
                'helpdesk_id' => $ticket->id,
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
    public function reply(Request $request, $ticketNumber)
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

            $ticket = Helpdesk::where('ticket_number', $ticketNumber)
                ->where('user_id', $user->id)
                ->first();

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

            // Create reply
            $detail = HelpdeskDetail::create([
                'helpdesk_id' => $ticket->id,
                'user_id' => $user->id,
                'message' => strip_tags($request->message, '<p><br><b><i><u><ul><ol><li><a>'),
                'type' => 'question',
                'file_path' => $fileData['file_path'] ?? null,
                'file_name' => $fileData['file_name'] ?? null,
                'file_type' => $fileData['file_type'] ?? null,
                'file_size' => $fileData['file_size'] ?? null,
            ]);

            // Update ticket status to waiting_reply
            $ticket->update(['status' => 'waiting_reply']);

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
                'ticket_number' => $ticketNumber,
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
    public function reopen($ticketNumber)
    {
        try {
            $user = Auth::user();

            $ticket = Helpdesk::where('ticket_number', $ticketNumber)
                ->where('user_id', $user->id)
                ->first();

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
                'ticket_number' => $ticketNumber,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reopen ticket'
            ], 500);
        }
    }
}
