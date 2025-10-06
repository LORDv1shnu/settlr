package com.settlr.backend.repository;

import com.settlr.backend.entity.GroupInvitation;
import com.settlr.backend.entity.GroupInvitation.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, Long> {

    List<GroupInvitation> findByInviteeIdAndStatus(Long inviteeId, InvitationStatus status);

    List<GroupInvitation> findByInviteeId(Long inviteeId);

    List<GroupInvitation> findByGroupIdAndStatus(Long groupId, InvitationStatus status);

    boolean existsByGroupIdAndInviteeIdAndStatus(Long groupId, Long inviteeId, InvitationStatus status);
}
