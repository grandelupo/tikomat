<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Channel;
use Illuminate\Auth\Access\Response;

class ChannelPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Channel $channel): bool
    {
        return $user->id === $channel->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->canCreateChannel();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Channel $channel): bool
    {
        return $user->id === $channel->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Channel $channel): bool
    {
        return $user->id === $channel->user_id && !$channel->is_default;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Channel $channel): bool
    {
        return $user->id === $channel->user_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Channel $channel): bool
    {
        return $user->id === $channel->user_id && !$channel->is_default;
    }
}
