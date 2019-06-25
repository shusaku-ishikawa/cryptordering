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

function init_contact_tab(is_initial = false) {
    var attachment_pk_list = [];
    var $message_target = $('#id_contact_message');
    call_user('GET')
    .done(function(data) {
        if (data.error) {
            set_error_message($message_target, data.error);
            return;
        }
        $('#id_contact_date').html(return_formatted_datetime((new Date()).getTime(), false));
        $('#id_contact_email').val(data.email_for_notice);
        $('#id_contact_name').val(data.full_name);
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = BASE_URL_LOGIN;
        }
        set_error_message($message_target, xhr);
    });
    // 初期ロード時のみ
    if (is_initial) {
        // var detach_button = $('#id_detach_file');
        var file_uploader = $('#fileupload');
        var attach_button = $('.js-upload-file');
        var inquiry_button = $('#id_contact_send_inquiry_button');
        var input_subject = $('#id_contact_subject');
        var input_body = $('#id_contact_body');
        var input_email = $('#id_contact_email');
        var preview_zone = $('#id_attachment_preview');
        var progress_bar = $('.progress');

        inquiry_button
        .on('click', function() {
            if (validate_contact_info($message_target)) {
                call_inquiry('POST', input_subject.val(), input_body.val(), input_email.val(), attachment_pk_list)
                .done(function(res) {
                    if (res.error) {
                        set_error_message($message_target, res.error);
                        return;
                    }
                    set_success_message($message_target, res.success);
                    return;
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = BASE_URL_LOGIN;
                    }
                    set_error_message($message_target, xhr);
                });
            }
        });

        
        /* 2. INITIALIZE THE FILE UPLOAD COMPONENT */
        file_uploader.fileupload({
            dataType: 'json',
            singleFileUploads: true,
            autoUpload: true,
            replaceFileInput: false,
            done: function (e, data) {  /* 3. PROCESS THE RESPONSE FROM THE SERVER */
                if (data.result.error) {
                    //alert('error');
                    set_error_message(message_target, data.result.error);
                    return;
                }
                if (attachment_pk_list.length >= 3) {
                    set_error_message(message_target, '添付ファイルは3つまでです');
                    return;
                }
                attachment_pk_list.push(data.result.pk + '');
                
                $container = $('<div>', {
                    class: "container attachment_preview",
                    style: "width:30%;height:auto;float:left;position:relative"
                }).appendTo(preview_zone);

                $img_wrapper = $('<div>', {
                    style: "position:relative"
                })
                .appendTo($container)
                .on('click', function() {
                    var i = attachment_pk_list.indexOf($(this).attr('pk'));
                    attachment_pk_list.splice(i, 1);
                    call_attachment('DELETE', $(this).attr('pk'))
                    .done((data) => {
                        if (data.error) {
                            set_error_message(message_target, data.error);
                            return;
                        }
                        $(this).parent().remove();
                    })
                    .fail(function(data, textStatus, xhr) {
                        if (data.status == 401) {
                            window.location.href = BASE_URL_LOGIN;
                        }
                        set_error_message(message_target, xhr);
                    });
                });

                $img = $('<img>', {
                    class: 'img-thumbnail',
                    id: 'file_' + data.result.pk,
                }).appendTo($img_wrapper);
                
                $('<div>', {
                    class: 'text',
                    text: '×'
                }).appendTo($img_wrapper);
                
                $('<p>', {
                    text: data.files[0].name,
                    style:"word-break : break-all;"
                }).appendTo($container);

                readURL(data.files[0], $img);
                
            },
            fail: function (e, data) {
                set_error_message(message_target, '失敗しました');
                return;
            }
        });
    }
}


