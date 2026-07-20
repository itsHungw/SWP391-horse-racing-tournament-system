CREATE TABLE disputes (
    id BIGSERIAL PRIMARY KEY,
    
    requester_id BIGINT NOT NULL,
    requester_role VARCHAR(50) NOT NULL,
    
    handler_id BIGINT,
    handler_role VARCHAR(50) NOT NULL,
    
    organization_id BIGINT,
    tournament_id BIGINT,
    
    reference_type VARCHAR(50) NOT NULL,
    reference_id BIGINT NOT NULL,
    
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    resolution_note TEXT,
    resolved_at TIMESTAMP(6) WITHOUT TIME ZONE,
    
    created_at TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITHOUT TIME ZONE,

    CONSTRAINT fk_disputes_requester FOREIGN KEY (requester_id) REFERENCES users(id),
    CONSTRAINT fk_disputes_handler FOREIGN KEY (handler_id) REFERENCES users(id)
    -- Giả sử đã có bảng organizations và tournaments, nếu chưa có FK chặt chẽ, ta có thể bỏ constraint để schema linh hoạt, nhưng tốt nhất cứ để nếu nó thực sự map tới. Ở đây tôi sẽ không thêm FK cho organization_id và tournament_id ngay lập tức nếu chúng không tồn tại, nhưng theo convention thì ta cứ để bình thường nếu chắc chắn.
    -- Để tránh rủi ro thiếu bảng, tôi sẽ không gán FK cho org_id và tournament_id vào lúc này vì chúng có thể Null và tham chiếu mềm.
);

CREATE TABLE dispute_attachments (
    id BIGSERIAL PRIMARY KEY,
    dispute_id BIGINT NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    created_at TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_attachments_dispute FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE
);

CREATE INDEX idx_disputes_requester ON disputes(requester_id, requester_role);
CREATE INDEX idx_disputes_handler ON disputes(handler_role, status);
CREATE INDEX idx_disputes_context ON disputes(tournament_id, organization_id);
CREATE INDEX idx_dispute_attachments_dispute ON dispute_attachments(dispute_id);
