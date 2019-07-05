
async function init_user_info_content_async() {
    let user;
    try {
        user = await call_user('GET');    
    } catch (error) {
        handle_error(error);
        return false;
    }
    if (user.error) {
        set_error_message(user.error);
        return false;
    }
    $('#id_date_joined').html(return_formatted_datetime(Date.parse(user.date_joined), false));
    $('#id_email').html(user.email);
    $('#id_full_name').val(user.full_name);
    $('#id_bb_api_key').val(user.bb_api_key);
    $('#id_bb_api_secret_key').val(user.bb_api_secret_key);
    $('#id_cc_api_key').val(user.cc_api_key);
    $('#id_cc_api_secret_key').val(user.cc_api_secret_key);
    $('#id_email_for_notice').val(user.email_for_notice);
    return true;
}

function init_user_info_tab(is_initial = false) {
    
    
    // 初期ロード時のみ
    if (is_initial) {
        $('#id_update_user_info_button').on('click', async function() {
            var full_name = $('#id_full_name').val();
            var bb_api_key = $('#id_bb_api_key').val();
            var bb_api_secret_key = $('#id_bb_api_secret_key').val();
            var cc_api_key = $('#id_cc_api_key').val();
            var cc_api_secret_key = $('#id_cc_api_secret_key').val();
            
            var email_for_notice = $('#id_email_for_notice').val();

            if(!email_for_notice.match(/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/)){
                // 不正なメールアドレスの場合
                set_error_message('メールアドレスの形式が不正です');
                $('#id_email_for_notice').focus();
                return false;
            }
            $(this).prop('disabled', true );
            let result;
            try {
                result = await call_user('POST', full_name, bb_api_key, bb_api_secret_key, cc_api_key, cc_api_secret_key, email_for_notice)
                if (result.error) {
                    set_error_message(result.error);
                    return false;
                }
                set_success_message('登録情報を更新しました');
                return true;
            } catch (error) {
                handle_error(error);
                return false;
            } finally {
                $(this).prop('disabled', false);
            }
            
        });
    }
    init_user_info_content_async();

}
