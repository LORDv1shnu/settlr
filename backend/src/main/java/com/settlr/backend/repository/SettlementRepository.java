package com.settlr.backend.repository;

import com.settlr.backend.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    /**
     * Find all settlements for a specific group
     */
    List<Settlement> findByGroupId(Long groupId);

    /**
     * Find all settlements where a user is the payer (from_user)
     */
    List<Settlement> findByFromUserId(Long userId);

    /**
     * Find all settlements where a user is the payee (to_user)
     */
    List<Settlement> findByToUserId(Long userId);

    /**
     * Find all settlements involving a specific user (either as payer or payee)
     */
    @Query("SELECT s FROM Settlement s WHERE s.fromUser.id = :userId OR s.toUser.id = :userId")
    List<Settlement> findByUserId(@Param("userId") Long userId);

    /**
     * Find all settlements in a group involving a specific user
     */
    @Query("SELECT s FROM Settlement s WHERE s.group.id = :groupId AND (s.fromUser.id = :userId OR s.toUser.id = :userId)")
    List<Settlement> findByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);

    /**
     * Find settlement between two users in a specific group
     */
    @Query("SELECT s FROM Settlement s WHERE s.group.id = :groupId AND s.fromUser.id = :fromUserId AND s.toUser.id = :toUserId")
    List<Settlement> findByGroupIdAndUsers(@Param("groupId") Long groupId, 
                                           @Param("fromUserId") Long fromUserId, 
                                           @Param("toUserId") Long toUserId);
}
