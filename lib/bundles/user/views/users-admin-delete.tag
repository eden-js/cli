<users-admin-delete-page>
    <form method="post" action="/admin/users/{ opts.usr.id }/delete">
        <div class="card">
            <div class="card-header">
                <strong>Delete Users</strong>
                <small>{ opts.usr.username }</small>
            </div>
            <div class="card-block">
                <input name="id" type="hidden" value={ opts.usr && opts.usr.id ? opts.usr.id : '' } if={ opts.usr && opts.usr.id } />
                <p>
                    Are you sure you want to delete <b>{ opts.usr.username }</b>?
                </p>
            </div>
            <div class="card-footer">
                <button type="submit" class="btn btn-primary">Submit</button>
            </div>
        </div>
    </form>
</users-admin-delete-page>
