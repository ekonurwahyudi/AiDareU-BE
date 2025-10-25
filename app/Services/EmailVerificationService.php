<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailVerificationService
{
    /**
     * Send verification email to user
     */
    public function sendVerificationCode(User $user): bool
    {
        try {
            $verificationCode = $user->generateEmailVerificationCode();
            
            // For now, we'll log the code instead of sending email
            // This is useful for development/testing
            Log::info("Email verification code for {$user->email}: {$verificationCode}");
            
            // TODO: Implement actual email sending using Laravel Mail
            // Uncomment and configure when email service is ready
            /*
            Mail::send('emails.verification', [
                'user' => $user,
                'code' => $verificationCode
            ], function ($message) use ($user) {
                $message->to($user->email, $user->nama_lengkap)
                       ->subject('Kode Verifikasi Email - AiDareU');
            });
            */
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to send verification email: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Verify email with code
     */
    public function verifyEmail(string $email, string $code): array
    {
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }

        if ($user->email_verified_at) {
            return [
                'success' => false,
                'message' => 'Email already verified'
            ];
        }

        if ($user->verifyEmailWithCode($code)) {
            return [
                'success' => true,
                'message' => 'Email verified successfully',
                'user' => $user
            ];
        }

        return [
            'success' => false,
            'message' => 'Invalid or expired verification code'
        ];
    }

    /**
     * Send welcome email after verification
     */
    public function sendWelcomeEmail(User $user): bool
    {
        try {
            Log::info("Sending welcome email to {$user->email}");
            
            // TODO: Implement welcome email template
            /*
            Mail::send('emails.welcome', [
                'user' => $user
            ], function ($message) use ($user) {
                $message->to($user->email, $user->nama_lengkap)
                       ->subject('Selamat Datang di AiDareU!');
            });
            */
            
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to send welcome email: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if verification code is valid
     */
    public function isValidVerificationCode(User $user, string $code): bool
    {
        return $user->email_verification_code === $code && 
               $user->email_verification_code_expires_at &&
               $user->email_verification_code_expires_at->isFuture();
    }

    /**
     * Generate and send new verification code
     */
    public function resendVerificationCode(string $email): array
    {
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            return [
                'success' => false,
                'message' => 'User not found'
            ];
        }

        if ($user->email_verified_at) {
            return [
                'success' => false,
                'message' => 'Email already verified'
            ];
        }

        if ($this->sendVerificationCode($user)) {
            return [
                'success' => true,
                'message' => 'Verification code sent successfully'
            ];
        }

        return [
            'success' => false,
            'message' => 'Failed to send verification code'
        ];
    }
}