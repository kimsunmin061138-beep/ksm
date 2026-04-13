/**
 * Main Javascript for Semiconductor Portfolio
 * Features: Sticky Nav, Scroll Animations, Modal Control, Board CRUD (localStorage)
 */

document.addEventListener('DOMContentLoaded', () => {

    /* --- Constants & state --- */
    const navbar = document.getElementById('navbar');
    const contactModal = document.getElementById('contactModal');
    const floatingContact = document.getElementById('floatingContact');
    const openContact = document.getElementById('openContact');
    const closeModal = document.getElementById('closeModal');
    const boardForm = document.getElementById('boardForm');
    const postList = document.getElementById('postList');

    let posts = JSON.parse(localStorage.getItem('ce_portfolio_posts')) || [];

    /* --- Sticky Navbar & Scroll Animations --- */
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const appearOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    const appearOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    document.querySelectorAll('.fade-in').forEach(fader => appearOnScroll.observe(fader));

    /* --- Modal Controls --- */
    const toggleModal = (show) => {
        if (!contactModal) return; // 모달이 없는 페이지(게시판 등) 대응
        contactModal.style.display = show ? 'flex' : 'none';
        document.body.style.overflow = show ? 'hidden' : 'auto';
    };

    if (floatingContact) {
        floatingContact.addEventListener('click', () => toggleModal(true));
    }
    if (openContact) {
        openContact.addEventListener('click', (e) => { e.preventDefault(); toggleModal(true); });
    }
    if (closeModal) {
        closeModal.addEventListener('click', () => toggleModal(false));
    }
    window.addEventListener('click', (e) => { 
        if (contactModal && e.target === contactModal) toggleModal(false); 
    });

    /* --- Contact Form AJAX (Formspree) --- */
    async function handleFormSubmit(event, statusId) {
        event.preventDefault();
        const form = event.target;
        const status = document.getElementById(statusId);
        if (!status) return; // 상태 표시줄이 없는 경우 방지
        const data = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');

        status.style.display = "block";
        status.style.color = "var(--primary-blue)";
        status.textContent = "보내는 중...";
        if (submitBtn) submitBtn.disabled = true;

        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: data,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                status.style.color = "green";
                status.textContent = "메시지가 성공적으로 전송되었습니다!";
                form.reset();
                setTimeout(() => {
                    status.style.display = "none";
                    if (statusId === 'formStatusModal') toggleModal(false);
                }, 5000);
            } else {
                const result = await response.json();
                status.style.color = "red";
                status.textContent = result.errors ? result.errors.map(error => error.message).join(", ") : "전송 오류가 발생했습니다.";
            }
        } catch (error) {
            status.style.color = "red";
            status.textContent = "네트워크 오류가 발생했습니다.";
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    const contactFormSection = document.getElementById('contactFormSection');
    const contactFormModal = document.getElementById('contactFormModal');

    if (contactFormSection) {
        contactFormSection.addEventListener('submit', (e) => handleFormSubmit(e, 'formStatusSection'));
    }
    if (contactFormModal) {
        contactFormModal.addEventListener('submit', (e) => handleFormSubmit(e, 'formStatusModal'));
    }

    /* --- 🚀 Firebase Server Integration --- */
    
    // [Firestore 정식 연동 완료]
    const firebaseConfig = {
        apiKey: "AIzaSyDp4zK6_aDWhyw5rV37hoEkVfGUkWi7JIo",
        authDomain: "webprogram-7bf23.firebaseapp.com",
        projectId: "webprogram-7bf23",
        storageBucket: "webprogram-7bf23.firebasestorage.app",
        messagingSenderId: "944425469159",
        appId: "1:944425469159:web:aeac2cd6d46bead8c18e42",
        measurementId: "G-F6CVWGTPZR"
    };

    // Firebase 초기화
    let db;
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
    } catch (e) {
        console.error("Firebase 초기화 실패:", e);
    }

    /* --- Free Board (Server CRUD) --- */
    const renderPosts = (data) => {
        if (!postList) return;
        postList.innerHTML = '';
        
        if (!data || data.length === 0) {
            postList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">아직 작성된 글이 없습니다. 첫 기록을 남겨보세요!</p>';
            return;
        }

        data.forEach((postDoc) => {
            const post = postDoc.data();
            const id = postDoc.id;
            const isSecret = post.isSecret || false;
            const postItem = document.createElement('div');
            postItem.className = `post-item ${isSecret ? 'is-secret' : ''}`;
            
            // 비밀글 처리 로직
            let contentHtml = `<p style="line-height: 1.6; color: #444; margin-top: 10px;">${post.content}</p>`;
            let titlePrefix = "";
            
            if (isSecret) {
                console.log(`포스트(${id})는 비밀글입니다.`); // 진단용 로그
                titlePrefix = `<span class="secret-badge"><i class="fas fa-lock"></i> 비밀글</span> `;
                contentHtml = `
                    <div id="secret-content-${id}" class="secret-content-placeholder" style="background: #fdf2f2; padding: 15px; border-radius: 8px; border: 1px dashed #feb2b2;">
                        <i class="fas fa-eye-slash" style="color: #e53e3e;"></i> <span style="color: #c53030; font-weight: 600;">이 글은 비밀글입니다.</span>
                        <span class="btn-unlock" onclick="unlockPost('${id}', '${post.password}')" style="margin-left: 10px; color: #3182ce; text-decoration: underline;">열람하기</span>
                    </div>
                `;
            } else {
                console.log(`포스트(${id})는 공개글입니다.`); // 진단용 로그
            }

            let html = `
                <div class="post-content">
                    <h4>
                        <i class="fas fa-user-circle" style="color: #ddd;"></i> 
                        ${titlePrefix}${post.title} 
                        <span style="font-weight: 400; font-size: 0.8rem; color: var(--primary-blue); background: #f0f7ff; padding: 2px 8px; border-radius: 4px; margin-left: 10px;">${post.name}</span>
                    </h4>
                    ${contentHtml}
                    <div class="post-meta">
                        <span><i class="far fa-clock"></i> ${new Date(post.date).toLocaleString('ko-KR')}</span>
                        <div class="post-actions" style="margin-left: auto; display: flex; gap: 15px;">
                            <span class="btn-reply-toggle" onclick="toggleReplyForm('${id}')">
                                <i class="fas fa-comment-dots"></i> 답글
                            </span>
                            <span class="btn-delete" onclick="deletePost('${id}', '${post.password}', ${isSecret})">
                                <i class="fas fa-trash-alt"></i> 삭제
                            </span>
                        </div>
                    </div>
                </div>
            `;

            if (post.replies && post.replies.length > 0) {
                html += `<div class="reply-list">`;
                post.replies.forEach((reply, idx) => {
                    const isReplySecret = reply.isSecret || false;
                    let replyContent = reply.content;
                    let replyTitle = `<i class="fas fa-level-up-alt fa-rotate-90" style="margin-right: 5px; color: #ccc;"></i> ${reply.name}`;

                    if (isReplySecret) {
                        replyTitle += ` <span class="secret-badge" style="font-size: 0.65rem;"><i class="fas fa-lock"></i> 비밀</span>`;
                        replyContent = `
                            <div id="secret-reply-${id}-${idx}" class="secret-content-placeholder" style="font-size: 0.85rem;">
                                비밀 답글입니다. <span class="btn-unlock" onclick="unlockReply('${id}', ${idx}, '${reply.password}')">열람</span>
                            </div>
                        `;
                    }

                    html += `
                        <div class="reply-item">
                            <strong style="display: block; margin-bottom: 5px;">${replyTitle}</strong>
                            <div id="reply-body-${id}-${idx}">${replyContent}</div>
                            <div style="font-size: 0.75rem; color: #aaa; margin-top: 8px;">${new Date(reply.date).toLocaleString('ko-KR')}</div>
                        </div>
                    `;
                });
                html += `</div>`;
            }

            html += `
                <div class="reply-form" id="replyForm-${id}">
                    <input type="text" id="replyName-${id}" placeholder="성함" required>
                    <textarea id="replyContent-${id}" placeholder="답글 내용" required></textarea>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label style="font-size: 0.8rem; cursor: pointer;">
                            <input type="checkbox" id="replySecret-${id}" onchange="document.getElementById('replyPass-${id}').style.display = this.checked ? 'block' : 'none'"> 비밀 답글
                        </label>
                        <input type="password" id="replyPass-${id}" placeholder="비번" style="display:none; padding: 5px; border: 1px solid #eee; width: 80px; font-size: 0.8rem;">
                    </div>
                    <button type="button" class="btn-primary" onclick="addReply('${id}')" style="padding: 8px 15px; font-size: 0.8rem;">등록</button>
                </div>
            `;

            postItem.innerHTML = html;
            postList.appendChild(postItem);
        });
    };

    // [마스터 비밀번호] 관리자인 사용자님만 알고 있는 번호입니다.
    const MASTER_PASSWORD = "20252578"; 

    // 비밀글 열람 기능
    window.unlockPost = async (id, correctPassword) => {
        const input = prompt("비밀번호 또는 마스터 번호를 입력하세요:");
        if (input === correctPassword || input === MASTER_PASSWORD) {
            const doc = await db.collection("posts").doc(id).get();
            document.getElementById(`secret-content-${id}`).innerHTML = 
                `<p style="line-height: 1.6; color: var(--primary-blue); font-weight: 500;">${doc.data().content}</p>`;
        } else {
            alert("비밀번호가 일치하지 않습니다.");
        }
    };

    window.unlockReply = (id, idx, correctPassword) => {
        const input = prompt("비밀번호 또는 마스터 번호를 입력하세요:");
        if (input === correctPassword || input === MASTER_PASSWORD) {
            db.collection("posts").doc(id).get().then(doc => {
                const reply = doc.data().replies[idx];
                document.getElementById(`secret-reply-${id}-${idx}`).innerHTML = 
                    `<span style="color: var(--primary-blue);">${reply.content}</span>`;
            });
        } else {
            alert("비밀번호가 일치하지 않습니다.");
        }
    };

    // 실시간 데이터 감시
    if (db && postList) {
        db.collection("posts").orderBy("date", "desc").onSnapshot((snapshot) => {
            renderPosts(snapshot.docs);
        });
    } else if (postList) {
        postList.innerHTML = '<p style="text-align: center; color: #e67e22; padding: 20px;">Firebase 설정을 완료하시면 서버 게시판이 활성화됩니다.</p>';
    }

    window.toggleReplyForm = (id) => {
        const form = document.getElementById(`replyForm-${id}`);
        if(form) form.style.display = form.style.display === 'flex' ? 'none' : 'flex';
    };

    window.addReply = async (id) => {
        if (!db) return alert("Firebase 설정이 필요합니다.");
        const nameInput = document.getElementById(`replyName-${id}`);
        const contentInput = document.getElementById(`replyContent-${id}`);
        const isSecret = document.getElementById(`replySecret-${id}`).checked;
        const password = document.getElementById(`replyPass-${id}`).value;
        
        if (!nameInput.value || !contentInput.value) return alert('이름과 내용을 입력해 주세요.');
        if (isSecret && !password) return alert('비밀번호를 입력해 주세요.');

        const newReply = { 
            name: nameInput.value, 
            content: contentInput.value, 
            date: new Date().toISOString(),
            isSecret,
            password
        };
        
        try {
            const docRef = db.collection("posts").doc(id);
            const doc = await docRef.get();
            const replies = doc.data().replies || [];
            replies.push(newReply);
            await docRef.update({ replies });
        } catch (e) {
            alert("답글 등록 실패: " + e.message);
        }
    };

    if (boardForm) {
        boardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!db) return alert("Firebase 설정이 필요합니다.");
            
            const isSecret = document.getElementById('isSecret').checked;
            const password = document.getElementById('boardPassword').value;

            if (isSecret && !password) return alert("비밀글 작성을 위해 비밀번호를 입력해 주세요.");

            const newPost = { 
                name: document.getElementById('boardName').value, 
                title: document.getElementById('boardTitle').value, 
                content: document.getElementById('boardContent').value, 
                date: new Date().toISOString(),
                replies: [],
                isSecret,
                password
            };

            try {
                await db.collection("posts").add(newPost);
                boardForm.reset();
                document.getElementById('boardPassword').style.display = 'none';
            } catch (e) {
                alert("글쓰기 실패: " + e.message);
            }
        });
    }

    window.deletePost = async (id, correctPassword, isSecret) => {
        if (!db) return;
        
        const input = prompt(isSecret ? "글의 비밀번호 또는 마스터 번호를 입력하세요:" : "삭제를 위해 비밀번호 또는 마스터 번호를 입력하세요 (일반글은 취소를 누르면 확인창이 뜹니다):");
        
        if (input === MASTER_PASSWORD || input === correctPassword) {
            // 삭제 진행
        } else if (!isSecret && input === null) {
            if (!confirm('정말로 이 글을 삭제하시겠습니까?')) return;
        } else {
            return alert("비밀번호가 틀려 삭제할 수 없습니다.");
        }

        try {
            await db.collection("posts").doc(id).delete();
        } catch (e) {
            alert("삭제 실패: " + e.message);
        }
    };

    /* --- Smooth Scrolling --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            if (!targetId) return;
            e.preventDefault();
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                // 모바일 메뉴 닫기
                const navToggle = document.getElementById('nav-toggle');
                if (navToggle) navToggle.checked = false;

                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});
