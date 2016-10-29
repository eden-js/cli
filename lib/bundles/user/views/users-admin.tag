<users-admin-page>
    <div class="users-admin">
        <grid grid={ opts.grid } table-class="table table-bordered bg-inverse" title="Users Grid">
            <yield to="buttons">
                <a href="/admin/users/add" class="btn btn-success">
                    Add
                </a>
            </yield>
        </grid>
    </div>
</users-admin-page>
