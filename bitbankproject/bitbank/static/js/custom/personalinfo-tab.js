function init_user_info_tab(is_initial = false) {
    var $message_target = $('#id_ajax_message');
    call_user('GET')
    .done(function(data) {
        if (data.error) {
            set_error_message($message_target, data.error);
            return;
        }
        //console.log(data);
        $('#id_date_joined').html(return_formatted_datetime(Date.parse(data.date_joined), false));
        $('#id_email').html(data.email);
        $('#id_full_name').val(data.full_name);
        $('#id_bb_api_key').val(data.bb_api_key);
        $('#id_bb_api_secret_key').val(data.bb_api_secret_key);
        $('#id_cc_api_key').val(data.cc_api_key);
        $('#id_cc_api_secret_key').val(data.cc_api_secret_key);
        
        $('#id_email_for_notice').val(data.email_for_notice);
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });
    // 初期ロード時のみ
    if (is_initial) {
        $('#id_update_user_info_button').on('click', function() {
            var full_name = $('#id_full_name').val();
            var bb_api_key = $('#id_bb_api_key').val();
            var bb_api_secret_key = $('#id_bb_api_secret_key').val();
            var cc_api_key = $('#id_cc_api_key').val();
            var cc_api_secret_key = $('#id_cc_api_secret_key').val();
            
            var email_for_notice = $('#id_email_for_notice').val();

            if(!email_for_notice.match(/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/)){
                // 不正なメールアドレスの場合
                set_error_message($message_target, 'メールアドレスの形式が不正です');
                $('#id_email_for_notice').focus();
                return;
            }

            call_user('POST', full_name, bb_api_key, bb_api_secret_key, cc_api_key, cc_api_secret_key, email_for_notice)
            .done(function(res) {
                if (res.error) {
                    console.log(res.error);
                    set_error_message($message_target, res.error);
                    return;
                }
                set_success_message($message_target, '登録情報を更新しました');
                return;
            })
            .fail(function(data, textStatus, xhr) {
                if (data.status == 401) {
                    window.location.href = BASE_URL_LOGIN;
                }
                set_error_message($message_target, xhr);
            });
        });
    }
}

function validate_contact_info($message_target) {
    //validations....
    var name = $('#id_contact_name');
    var email = $('#id_contact_email');
    var subject = $('#id_contact_subject');
    var body = $('#id_contact_body');
    
    if (name.val() == '') {
        set_error_message($message_target, '名前を入力してください');
        name.focus();
        return false;
    }
    if (email.val() == '') {
        set_error_message($message_target, '通知用メールアドレスを入力してください');
        email.focus();
        return false;
    }
    if (subject.val() == '') {
        set_error_message($message_target, '件名を入力してください');
        subject.focus();
        return false;
    }
    if (body.val() == '') {
        set_error_message($message_target, '内容を入力してください');
        body.focus();
        return false;
    }
    return true;
}
