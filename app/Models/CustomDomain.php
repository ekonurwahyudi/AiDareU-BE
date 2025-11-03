<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomDomain extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'landing_page_id',
        'domain',
    ];

    public function landingPage()
    {
        return $this->belongsTo(LandingPage::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}


