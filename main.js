/**
 * Main Javascript for Semiconductor Portfolio
 * Features: Sticky Nav, Scroll Animations, Modal Control, Board CRUD (localStorage)
 */

document.addEventListener('DOMContentLoaded', () => {
    /* --- Layout-Stable Typing Effect Implementation --- */
    const typeWriter = (el, text, speed = 50) => {
        el.innerHTML = '';
        el.style.visibility = 'visible';
        
        // 글자들을 미리 스팬으로 감싸서 투명하게 삽입 (공간 확보)
        const spans = text.split('').map(char => {
            const span = document.createElement('span');
            if (char === '\n') {
                return document.createElement('br');
            }
            span.textContent = char;
            span.style.opacity = '0';
            span.style.transition = 'opacity 0.1s ease';
            return span;
        });

        spans.forEach(span => el.appendChild(span));

        // 커서 추가
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        el.appendChild(cursor);

        let i = 0;
        const typing = () => {
            if (i < spans.length) {
                const current = spans[i];
                if (current.tagName === 'SPAN') {
                    current.style.opacity = '1';
                    // 커서를 현재 글자 뒤로 이동
                    current.after(cursor);
                } else if (current.tagName === 'BR') {
                    current.after(cursor);
                }
                i++;
                setTimeout(typing, speed);
            } else {
                if (cursor) cursor.remove();
            }
        };
        typing();
    };

    const h1El = document.getElementById('hero-typing-h1');
    const pEl = document.getElementById('hero-typing-p');

    if (h1El && pEl) {
        const h1Text = "불가능을 현실로 만드는 기술\u00A0혁신,\n본격적인 융합으로 증명하겠습니다.";
        const pText = "동양미래대 로봇소프트웨어과에서 반도체 장비 모형을 직접 조립하고 제어하며 실무 감각을 익힌 Customer Engineer 스페셜리스트입니다.";

        // 초기에는 숨김 처리 (공간은 차지함)
        h1El.style.visibility = 'hidden';
        pEl.style.visibility = 'hidden';

        setTimeout(() => {
            typeWriter(h1El, h1Text, 70);
            
            setTimeout(() => {
                typeWriter(pEl, pText, 30);
            }, h1Text.length * 70 + 500);
        }, 800);
    }


    /* --- Constants & state --- */
    const navbar = document.getElementById('navbar');
    const contactModal = document.getElementById('contactModal');
    const floatingContact = document.getElementById('floatingContact');
    const openContact = document.getElementById('openContact');
    const closeModal = document.getElementById('closeModal');
    const boardForm = document.getElementById('boardForm');
    const postList = document.getElementById('postList');
    const formContainer = document.getElementById('formContainer');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');

    let posts = JSON.parse(localStorage.getItem('ce_portfolio_posts')) || [];

    const videoModal = document.getElementById('videoModal');
    const projectVideo = document.getElementById('projectVideo');
    const closeVideoModal = document.getElementById('closeVideoModal');

    /* --- Video Modal Controls --- */
    window.openVideoModal = (source) => {
        if (!videoModal || !projectVideo) return;
        projectVideo.src = source;
        videoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        projectVideo.play();
    };

    const closeVideo = () => {
        if (!videoModal || !projectVideo) return;
        videoModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        projectVideo.pause();
        projectVideo.src = ""; // 비디오 세션 종료
    };

    if (closeVideoModal) {
        closeVideoModal.addEventListener('click', closeVideo);
    }

    window.addEventListener('click', (e) => { 
        if (contactModal && e.target === contactModal) toggleModal(false); 
        if (videoModal && e.target === videoModal) closeVideo();
    });

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
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('appear');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    document.querySelectorAll('.fade-in, .fade-up, .fade-left, .fade-right, .section-title').forEach(fader => {
        appearOnScroll.observe(fader);
    });

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
                        
                        <div class="post-votes">
                            <span class="btn-vote btn-upvote ${getVotedType(id) === 'likes' ? 'active' : ''}" onclick="handleVote('${id}', 'likes')">
                                <i class="far fa-thumbs-up"></i> 추천 <span>${post.likes || 0}</span>
                            </span>
                            <span class="btn-vote btn-downvote ${getVotedType(id) === 'dislikes' ? 'active' : ''}" onclick="handleVote('${id}', 'dislikes')">
                                <i class="far fa-thumbs-down"></i> 비추천 <span>${post.dislikes || 0}</span>
                            </span>
                        </div>

                        <div class="post-actions">
                            <span class="btn-reply-toggle" onclick="toggleReplyForm('${id}')">
                                <i class="fas fa-comment-dots"></i> 답글
                            </span>
                            <span class="btn-edit" onclick="editPost('${id}', '${post.password}')">
                                <i class="fas fa-edit"></i> 수정
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
                            <div style="font-size: 0.75rem; color: #aaa; margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <span>${new Date(reply.date).toLocaleString('ko-KR')}</span>
                                <span class="btn-delete" onclick="deleteReply('${id}', ${idx}, '${reply.password}')" style="font-size: 0.7rem;">
                                    <i class="fas fa-trash-alt"></i> 삭제
                                </span>
                            </div>
                        </div>
                    `;
                });
                html += `</div>`;
            }

            html += `
                <div class="reply-form" id="replyForm-${id}">
                    <input type="text" id="replyName-${id}" placeholder="성함" required>
                    <textarea id="replyContent-${id}" placeholder="답글 내용" required></textarea>
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <label style="font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="replySecret-${id}"> <i class="fas fa-lock"></i> 비밀 답글
                        </label>
                        <input type="password" id="replyPass-${id}" placeholder="비밀번호 (수정/삭제용)" required style="padding: 5px 10px; border: 1px solid #eee; border-radius: 6px; width: 160px; font-size: 0.8rem;">
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

    // 투표 고도화 로직 (localStorage 객체 활용)
    const getVotedType = (postId) => {
        const votes = JSON.parse(localStorage.getItem('ce_portfolio_votes_map')) || {};
        return votes[postId]; // 'likes', 'dislikes' 또는 undefined
    };

    // 연타 방지용 락(Lock)
    const votingLocks = new Set();

    window.handleVote = async (id, requestedType) => {
        if (!db) return;
        if (votingLocks.has(id)) return; // 이미 처리 중이면 무시

        const currentVote = getVotedType(id);
        const votes = JSON.parse(localStorage.getItem('ce_portfolio_votes_map')) || {};

        votingLocks.add(id); // 락 설정

        try {
            if (currentVote === requestedType) {
                // Scenario A: 같은 버튼 다시 누름 (취소)
                await db.collection("posts").doc(id).update({ [requestedType]: firebase.firestore.FieldValue.increment(-1) });
                delete votes[id];
                localStorage.setItem('ce_portfolio_votes_map', JSON.stringify(votes));
            } else if (currentVote) {
                // Scenario B: 다른 버튼 누름 (차단)
                const targetText = currentVote === 'likes' ? '추천' : '비추천';
                alert(`이미 ${targetText}을(를) 하셨습니다. 기존 선택을 취소한 후 다시 투표해 주세요.`);
            } else {
                // Scenario C: 처음 누름 (투표)
                await db.collection("posts").doc(id).update({ [requestedType]: firebase.firestore.FieldValue.increment(1) });
                votes[id] = requestedType;
                localStorage.setItem('ce_portfolio_votes_map', JSON.stringify(votes));
            }
        } catch (e) {
            alert("요청 처리 중 오류가 발생했습니다: " + e.message);
        } finally {
            votingLocks.delete(id); // 처리 완료 후 락 해제
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

    window.toggleBoardForm = (mode = 'new') => {
        if (!formContainer) return;
        
        if (formContainer.style.display === 'none' || mode === 'edit') {
            formContainer.style.display = 'block';
            if (mode === 'new') {
                boardForm.reset();
                document.getElementById('editId').value = '';
                if (formTitle) formTitle.textContent = '새 글 남기기';
                if (submitBtn) submitBtn.textContent = '글 남기기';
            }
            // 폼으로 스크롤
            window.scrollTo({
                top: formContainer.offsetTop - 120,
                behavior: 'smooth'
            });
        } else {
            formContainer.style.display = 'none';
        }
    };

    window.editPost = async (id, correctPassword) => {
        const input = prompt("수정을 위해 비밀번호 또는 마스터 번호를 입력하세요:");
        if (input === MASTER_PASSWORD || input === correctPassword) {
            try {
                const doc = await db.collection("posts").doc(id).get();
                const post = doc.data();
                
                // 폼 채우기
                document.getElementById('boardName').value = post.name;
                document.getElementById('boardTitle').value = post.title;
                document.getElementById('boardContent').value = post.content;
                document.getElementById('isSecret').checked = post.isSecret;
                document.getElementById('boardPassword').value = post.password;
                document.getElementById('editId').value = id;
                
                if (formTitle) formTitle.textContent = '글 수정하기';
                if (submitBtn) submitBtn.textContent = '수정 완료';
                
                toggleBoardForm('edit');
            } catch (e) {
                alert("데이터를 불러오는데 실패했습니다: " + e.message);
            }
        } else {
            alert("비밀번호가 일치하지 않습니다.");
        }
    };

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
        if (!password) return alert('수정 및 삭제를 위해 비밀번호를 입력해 주세요.');

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
            const editId = document.getElementById('editId').value;

            if (!password) return alert("수정 및 삭제를 위해 비밀번호를 입력해 주세요.");

            const postData = { 
                name: document.getElementById('boardName').value, 
                title: document.getElementById('boardTitle').value, 
                content: document.getElementById('boardContent').value, 
                isSecret,
                password
            };

            try {
                if (editId) {
                    await db.collection("posts").doc(editId).update(postData);
                    alert("글이 성공적으로 수정되었습니다.");
                } else {
                    postData.date = new Date().toISOString();
                    postData.replies = [];
                    postData.likes = 0;
                    postData.dislikes = 0;
                    await db.collection("posts").add(postData);
                    alert("글이 등록되었습니다.");
                }
                boardForm.reset();
                toggleBoardForm();
            } catch (e) {
                alert("요청 처리 실패: " + e.message);
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

    window.deleteReply = async (id, idx, correctPassword) => {
        if (!db) return;
        const input = prompt("답글 삭제를 위해 비밀번호 또는 마스터 번호를 입력하세요:");
        if (input === MASTER_PASSWORD || input === correctPassword) {
            try {
                const docRef = db.collection("posts").doc(id);
                const doc = await docRef.get();
                const replies = doc.data().replies || [];
                replies.splice(idx, 1);
                await docRef.update({ replies });
                alert("답글이 삭제되었습니다.");
            } catch (e) {
                alert("삭제 실패: " + e.message);
            }
        } else {
            alert("비밀번호가 일치하지 않습니다.");
        }
    };

    /* --- Image Lightbox --- */
    const imageModal = document.getElementById('imageModal');
    const enlargedImage = document.getElementById('enlargedImage');
    const closeImageModal = document.getElementById('closeImageModal');

    window.openImageModal = (src) => {
        if (!imageModal || !enlargedImage) return;
        enlargedImage.src = src;
        imageModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            enlargedImage.style.transform = 'scale(1)';
        }, 10);
    };

    const closeImage = () => {
        if (!imageModal || !enlargedImage) return;
        enlargedImage.style.transform = 'scale(0.9)';
        setTimeout(() => {
            imageModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            enlargedImage.src = "";
        }, 300);
    };

    if (closeImageModal) {
        closeImageModal.addEventListener('click', closeImage);
    }

    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal || e.target.id === 'imageModalContent') {
                closeImage();
            }
        });
    }

    // 모든 프로젝트 이미지에 클릭 이벤트 연결
    document.querySelectorAll('.project-img-v2 img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
            // 비디오 버튼 클릭 시에는 작동 안함
            if (e.target.closest('.video-overlay')) return;
            openImageModal(img.src);
        });
    });

    // ESC 키로 모달 닫기 공통 처리
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (contactModal && contactModal.style.display === 'flex') toggleModal(false);
            if (videoModal && videoModal.style.display === 'flex') closeVideo();
            if (imageModal && imageModal.style.display === 'flex') closeImage();
        }
    });

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

    /* --- Back to Top Button Logic --- */
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
