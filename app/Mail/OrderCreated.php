<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Order;

class OrderCreated extends Mailable
{
    use Queueable, SerializesModels;

    public $order;
    public $checkoutUrl;
    public $isSeller;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, string $checkoutUrl, bool $isSeller = false)
    {
        $this->order = $order;
        $this->checkoutUrl = $checkoutUrl;
        $this->isSeller = $isSeller;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isSeller
            ? "Pesanan Baru #{$this->order->nomor_order} - {$this->order->customer->nama}"
            : "Konfirmasi Pesanan #{$this->order->nomor_order}";

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $view = $this->isSeller
            ? 'emails.order-created-seller'
            : 'emails.order-created-customer';

        return new Content(
            view: $view,
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
